<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-btn aria-label="Menu" dense flat icon="menu" round @click="toggleLeftDrawer"/>

        <q-toolbar-title> GroupChat-GPT</q-toolbar-title>

        <ThreadPrefs/>

        <div class="q-ml-sm">Quasar v{{ $q.version }}</div>
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" bordered>
      <q-list>
        <q-item-label header> Essential Links</q-item-label>

        <EssentialLink v-for="link in essentialLinks" :key="link.title" v-bind="link"/>
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view/>
    </q-page-container>
  </q-layout>
</template>

<script lang="ts" setup>
import EssentialLink, {EssentialLinkProps} from "components/EssentialLink.vue";
import {ref} from "vue";
import ThreadPrefs from "pages/ThreadPrefs.vue";

const essentialLinks: EssentialLinkProps[] = [
  {
    title: "GitHub Page",
    caption: "andreicozma1/GroupChat-GPT",
    icon: "code",
    link: "https://github.com/andreicozma1/GroupChat-GPT",
  },
  {
    title: "OpenAI API Docs",
    caption: "beta.openai.com/docs",
    icon: "public",
    link: "https://beta.openai.com/docs",
  },
  {
    title: "Andrei's Portfolio",
    caption: "andreicozma.com",
    icon: "school",
    link: "https://andreicozma.com",
  },
];

const leftDrawerOpen = ref(false);

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value;
}
</script>
