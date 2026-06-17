import { createApp } from 'vue';
import { createPinia } from 'pinia';
import naive from 'naive-ui';
import router from './router';
import App from './App.vue';
import './styles/global.css';

// 初始化主题
const theme = localStorage.getItem('theme') || 'light';
if (theme === 'dark') {
  document.documentElement.setAttribute('data-theme', 'dark');
}

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);
app.use(naive);

app.mount('#app');
