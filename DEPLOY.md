# 云上部署命令

本文档给出前端 TaskFlow 在云环境下的构建与部署命令。生产环境使用 **Dockerfile.prod**（多阶段构建：Node 构建 + Nginx 提供静态资源）。

**应用服务器部署在华为云 ECS 实例上**时，可直接按下方「华为云 ECS 部署」流程操作。

## 部署注意事项（必读）

- **API 与鉴权**：前端所有请求（含附件下载）均走 **`/api`**，并携带 `Authorization: Bearer <token>`。Nginx 反向代理需将 **`/api`**（含 `/api/attachments/*`）完整转发到后端，不要只代理部分路径。
- **附件下载与预览**：前端**仅**使用 **`GET /api/attachments/{id}/download`** 获取文件流，不使用 `fileUrl` 直链。后端需在该接口内返回 200 + 文件流（或 404/500 且非 200 时不返回文件体），前端会先判断 `response.ok` 再保存/展示，避免「下载文件损坏」。部署时确保该路径被正确代理到后端。
- **后端同机部署**：若前端与后端在同一台 ECS，按下方「方式三」用宿主机 Nginx 统一转发 `/` 与 `/api` 即可。

---

## 华为云 ECS 部署（推荐）

适用场景：前端部署在华为云 ECS，后端可在同一台 ECS 或另一台/其他服务。

### 前置条件

- 已购买华为云 ECS，并绑定弹性公网 IP（或域名）。
- **建议 ECS 内存 ≥ 2GB**。在 ECS 上执行 `docker build` 时若出现 **exit code 137**，多为内存不足（OOM），可：升级实例规格到 2GB+ 内存，或在 Dockerfile.prod 中将 `NODE_OPTIONS=--max-old-space-size=2048` 改为 `1024` 再试。
- 安全组放行：**入方向** 80（HTTP）、如需 HTTPS 再放行 443。
- ECS 已安装 Docker（未安装可执行）：
  ```bash
  curl -fsSL https://get.docker.com | sh
  systemctl enable docker && systemctl start docker
  ```

### 方式一：在 ECS 上直接构建并运行（无需镜像仓库）

SSH 登录 ECS 后，在项目目录下执行：

```bash
# 1. 进入项目目录（若代码在 /opt/taskflow）
cd /opt/taskflow

# 2. 构建镜像（后端与前端同机时可不指定 VITE_API_BASE_URL，用 Nginx 代理 /api）
docker build -f Dockerfile.prod -t taskflow-frontend:latest .

# 若后端在别的地址，构建时指定（替换为实际后端 API 根地址）
# docker build -f Dockerfile.prod \
#   --build-arg VITE_API_BASE_URL=https://你的后端域名/api \
#   -t taskflow-frontend:latest .

# 3. 停止旧容器（若之前已部署）
docker stop taskflow 2>/dev/null; docker rm taskflow 2>/dev/null

# 4. 启动新容器（宿主机 80 端口，重启策略：除非手动停止否则自动重启）
docker run -d -p 80:80 --restart unless-stopped --name taskflow taskflow-frontend:latest
```

访问：`http://ECS公网IP` 或 `http://你的域名`。

### 方式二：推送镜像到华为云 SWR，再在 ECS 上拉取运行

适合在本地或 CI 构建镜像，再在 ECS 上拉取部署。

**步骤 1：本地/CI 构建并推送到华为云 SWR**

```bash
# 登录华为云 SWR（区域码如 cn-north-4，组织名在 SWR 控制台创建）
docker login -u 区域名 -p 登录密码 swr.区域码.myhuaweicloud.com

# 构建（可选指定后端 API）
docker build -f Dockerfile.prod -t taskflow-frontend:latest .
# 或：docker build -f Dockerfile.prod --build-arg VITE_API_BASE_URL=https://api.xxx.com/api -t taskflow-frontend:latest .

# 打标签并推送（替换 区域码、组织名）
docker tag taskflow-frontend:latest swr.区域码.myhuaweicloud.com/组织名/taskflow-frontend:latest
docker push swr.区域码.myhuaweicloud.com/组织名/taskflow-frontend:latest
```

**步骤 2：在华为云 ECS 上拉取并运行**

```bash
# 若 ECS 与 SWR 同区域，可内网拉取（更快）；否则公网拉取
docker login -u 区域名 -p 登录密码 swr.区域码.myhuaweicloud.com
docker pull swr.区域码.myhuaweicloud.com/组织名/taskflow-frontend:latest

docker stop taskflow 2>/dev/null; docker rm taskflow 2>/dev/null
docker run -d -p 80:80 --restart unless-stopped --name taskflow swr.区域码.myhuaweicloud.com/组织名/taskflow-frontend:latest
```

### 方式三：前端 + 后端同机（ECS 上 Nginx 反向代理）

若后端 Java/Node 等服务也部署在同一台 ECS（如监听 8080），可用 Nginx 做统一入口：

- 前端静态：由容器内 Nginx 提供（容器 80）。
- 宿主机 Nginx：对外 80，将 `/` 转发到前端容器，将 `/api` 转发到后端。

**宿主机安装 Nginx 后**，配置示例（如 `/etc/nginx/conf.d/taskflow.conf`）：

```nginx
server {
  listen 80;
  server_name 你的域名或ECS公网IP;

  location / {
    proxy_pass http://127.0.0.1:80;   # 前端 Docker 容器
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }

  location /api/ {
    proxy_pass http://127.0.0.1:8080/api/;   # 后端服务
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

此时前端构建**不需要**指定 `VITE_API_BASE_URL`（用相对路径 `/api` 即可）。重载 Nginx：`nginx -s reload`。

### 一键更新脚本示例（ECS 上使用）

在 ECS 项目目录保存为 `deploy.sh`，每次更新代码后执行 `./deploy.sh`：

```bash
#!/bin/bash
set -e
cd /opt/taskflow   # 改为你的项目路径
git pull           # 或从 SWR 拉取最新镜像
docker build -f Dockerfile.prod -t taskflow-frontend:latest .
docker stop taskflow 2>/dev/null; docker rm taskflow 2>/dev/null
docker run -d -p 80:80 --restart unless-stopped --name taskflow taskflow-frontend:latest
echo "TaskFlow 前端已更新并启动"
```

---

## 一、构建与运行（通用 Docker）

### 1. 仅构建镜像（不指定后端地址，前端通过相对路径 `/api` 请求，需同机 Nginx 反向代理或同源后端）

```bash
docker build -f Dockerfile.prod -t taskflow-frontend:latest .
```

### 2. 构建时指定后端 API 地址（前端直连云上后端）

将 `https://你的后端域名/api` 替换为实际地址，例如：

```bash
docker build -f Dockerfile.prod \
  --build-arg VITE_API_BASE_URL=https://api.example.com/api \
  -t taskflow-frontend:latest .
```

### 3. 本地运行容器（端口 80）

```bash
docker run -d -p 80:80 --name taskflow taskflow-frontend:latest
```

访问：`http://localhost`

### 4. 使用环境变量传入后端地址（运行时通过 Nginx 代理，见下方「同机反向代理」）

若不在构建时写死后端地址，可保留构建为：

```bash
docker build -f Dockerfile.prod -t taskflow-frontend:latest .
```

再在同一台机器用 Nginx 或 Caddy 把 `/api` 反向代理到后端，前端保持相对路径 `/api` 即可。

---

## 二、推送到镜像仓库

### 阿里云 ACR

```bash
# 登录
docker login --username=你的用户名 registry.cn-hangzhou.aliyuncs.com

# 打标签（将 registry 和命名空间替换为你的）
docker tag taskflow-frontend:latest registry.cn-hangzhou.aliyuncs.com/你的命名空间/taskflow-frontend:latest

# 推送
docker push registry.cn-hangzhou.aliyuncs.com/你的命名空间/taskflow-frontend:latest
```

### 腾讯云 TCR

```bash
docker login ccr.ccs.tencentyun.com
docker tag taskflow-frontend:latest ccr.ccs.tencentyun.com/你的命名空间/taskflow-frontend:latest
docker push ccr.ccs.tencentyun.com/你的命名空间/taskflow-frontend:latest
```

### 华为云 SWR

```bash
docker login -u 区域名 -p 密码 swr.区域码.myhuaweicloud.com
docker tag taskflow-frontend:latest swr.区域码.myhuaweicloud.com/组织名/taskflow-frontend:latest
docker push swr.区域码.myhuaweicloud.com/组织名/taskflow-frontend:latest
```

### Docker Hub

```bash
docker login
docker tag taskflow-frontend:latest 你的用户名/taskflow-frontend:latest
docker push 你的用户名/taskflow-frontend:latest
```

---

## 三、云服务器上拉取并运行

**华为云 ECS** 上部署请直接参考上文「华为云 ECS 部署」章节。

在已安装 Docker 的云主机上执行（镜像地址按实际替换）：

```bash
# 拉取
docker pull registry.cn-hangzhou.aliyuncs.com/你的命名空间/taskflow-frontend:latest

# 运行（宿主机 80 端口）
docker run -d -p 80:80 --restart unless-stopped --name taskflow taskflow-frontend:latest
```

---

## 四、同机 Nginx 反向代理到后端

若前端与后端在同一台机器，可用宿主机 Nginx 统一对外：

- 前端：`/` → 本机容器 80 或静态文件
- 后端：`/api` → 本机后端服务（如 `http://127.0.0.1:8080`）

示例 Nginx 配置（宿主机）：

```nginx
server {
  listen 80;
  server_name 你的域名或IP;

  location / {
    proxy_pass http://127.0.0.1:80;  # 前端容器
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
  }

  location /api/ {
    proxy_pass http://127.0.0.1:8080/api/;  # 后端服务
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

---

## 五、不使用 Docker 的静态部署

在本地构建后，将 `dist` 上传到云主机 Nginx / OSS / 对象存储即可：

```bash
# 本地构建（可选指定后端地址）
export VITE_API_BASE_URL=https://api.example.com/api
npm ci
npm run build

# 将 dist 目录上传到服务器，例如
scp -r dist/* user@服务器IP:/var/www/taskflow/
```

Nginx 根目录指向 `dist` 所在目录，并配置 `try_files $uri $uri/ /index.html;` 以支持 SPA 路由。

---

## 六、环境变量说明

| 变量 | 说明 |
|------|------|
| `VITE_API_BASE_URL` | 后端 API 根地址（如 `https://api.example.com/api`）。不设置时前端使用相对路径 `/api`，依赖同源或反向代理。 |

构建时通过 `--build-arg VITE_API_BASE_URL=...` 传入；若使用静态部署，在构建前 `export VITE_API_BASE_URL=...` 即可。

---

## 七、附件与存储

- **上传**：前端通过 `POST /api/tasks/{taskId}/attachments` 上传附件，后端可将文件存入华为云 OBS 等对象存储，并返回带 `fileUrl` 的附件记录。
- **下载与预览**：前端**不**使用 `fileUrl` 直接请求 OBS 或静态文件地址，而是统一调用 **`GET /api/attachments/{id}/download`**（带 Bearer 鉴权）。后端在该接口内从 OBS 拉取文件流并返回 200 + 文件流；文件不存在返回 404、其它异常返回 500，且失败时勿返回 200 + JSON，以免前端误将错误内容当文件保存。只要 Nginx 将 `/api` 转发到后端，附件下载与预览即可正常工作。
