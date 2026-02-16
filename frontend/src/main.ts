import { createApp, defineCustomElement } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import './style.css';

import FButton from './components/FButton.vue';
import FCalendar from './components/FCalendar.vue';
import FDialog from './components/FDialog.vue';
import FCard from './components/FCard.vue';
import FSelect from './components/FSelect.vue';

// Create Vue App
const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);
app.component('FButton', FButton);
app.component('FCalendar', FCalendar);
app.component('FDialog', FDialog);
app.component('FCard', FCard);
app.component('FSelect', FSelect);

app.mount('#app');
