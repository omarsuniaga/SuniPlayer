import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './ui/App.vue'

const app = createApp(App)
app.use(createPinia())
app.mount('#app')
