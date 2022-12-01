<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Tab 1</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Tab 1</ion-title>
        </ion-toolbar>
      </ion-header>

      <!--      <ExploreContainer name="Tab 1 page"/>-->


      <ion-list>
        <ion-item v-for="(item, index) in items" :key="index">
          <ion-avatar slot="start">
            <img :src="'https://picsum.photos/80/80?random=' + index" alt="avatar"/>
          </ion-avatar>
          <ion-label>{{ item }}</ion-label>
        </ion-item>
      </ion-list>
      <ion-infinite-scroll @ionInfinite="ionInfinite">
        <ion-infinite-scroll-content></ion-infinite-scroll-content>
      </ion-infinite-scroll>


    </ion-content>

    <ion-card>
      <ion-card-header>
        <ion-card-title>AI Chatbot</ion-card-title>
        <!--            <ion-card-subtitle>Card Subtitle</ion-card-subtitle>-->
      </ion-card-header>

      <ion-card-content>
        <ion-textarea
            :value="message"
            auto-grow
            autofocus
            clear-input
            enterkeyhint="send"
            inputmode="text"
            minlength="1"
            placeholder="Type to chat with the AI"
            required
            spellcheck
            style="border: 1px solid lightblue; border-radius: 5px; padding: 5px;"
            type="text"
        />
      </ion-card-content>
      <ion-button class="ion-margin" fill="outline" @click="sendMessage">Send</ion-button>

    </ion-card>
  </ion-page>
</template>

<script lang="ts" setup>
import { reactive, ref } from "vue"
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from "@ionic/vue"

const message = ref("Hello, how are you today?")
const items = reactive([]) as string[]

const generateItems = () => {
  const count = items.length + 1
  for (let i = 0; i < 50; i++) {
    items.push(`Item ${count + i}`)
  }
}

const ionInfinite = (ev) => {
  generateItems()
  setTimeout(() => ev.target.complete(), 500)
}

const sendMessage = () => {
  console.log("Hello World")
}

generateItems()
</script>
