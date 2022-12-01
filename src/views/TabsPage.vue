<template>
  <ion-page>
    <ion-tabs>
      <ion-router-outlet></ion-router-outlet>

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


      <!--      <ion-tab-bar slot="bottom">-->
      <!--        <ion-tab-button tab="tab1" href="/tabs/tab1">-->
      <!--          <ion-icon :icon="triangle" />-->
      <!--          <ion-label>Tab 1</ion-label>-->
      <!--        </ion-tab-button>-->
      <!--          -->
      <!--        <ion-tab-button tab="tab2" href="/tabs/tab2">-->
      <!--          <ion-icon :icon="ellipse" />-->
      <!--          <ion-label>Tab 2</ion-label>-->
      <!--        </ion-tab-button>-->
      <!--        -->
      <!--        <ion-tab-button tab="tab3" href="/tabs/tab3">-->
      <!--          <ion-icon :icon="square" />-->
      <!--          <ion-label>Tab 3</ion-label>-->
      <!--        </ion-tab-button>-->
      <!--      </ion-tab-bar>-->
    </ion-tabs>
  </ion-page>
</template>

<script lang="ts" setup>
import { IonPage, IonRouterOutlet, IonTabs } from "@ionic/vue"
import { ref } from "vue"

const message = ref("Hello, how are you today?")

const sendMessage = () => {
  console.log("Hello World")
}
</script>
