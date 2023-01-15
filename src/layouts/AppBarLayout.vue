<template>
    <q-header elevated>
        <q-toolbar>
            <q-btn aria-label="Menu"
                   dense
                   flat
                   icon="menu"
                   round
                   @click="toggleSideMenu"
            />
            <q-toolbar-title> GroupChat-GPT</q-toolbar-title>
            <ChatThreadPrefs/>
            <div class="q-ml-sm">Quasar v{{ $q.version }}</div>
        </q-toolbar>
    </q-header>

    <q-drawer v-model="sideMenuOpen" bordered>
        <SideMenu/>
    </q-drawer>
</template>
<script lang="ts" setup>
import {ref} from "vue";
import ChatThreadPrefs from "components/ChatThreadPrefs.vue";
import SideMenu from "components/SideMenu.vue";

const sideMenuOpen = ref(false);

const toggleSideMenu = () => {
	sideMenuOpen.value = !sideMenuOpen.value;
};
</script>
