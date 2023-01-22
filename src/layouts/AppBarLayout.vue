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
            <q-toolbar-title> {{ activeThread.name }}</q-toolbar-title>

            <q-chip v-if="infoStore.message"
                    class="absolute-center q-ma-none">
                {{ infoStore.message }}
            </q-chip>

            <ChatThreadPrefs />
            <!--            <div class="q-ml-sm">Quasar v{{ $q.version }}</div>-->
        </q-toolbar>
    </q-header>

    <q-drawer v-model="sideMenuOpen"
              bordered>
        <SideMenu />
    </q-drawer>
</template>
<script lang="ts"
        setup>
import {computed, ComputedRef, ref} from "vue";
import ChatThreadPrefs from "components/ThreadPrefs.vue";
import SideMenu from "components/SideMenu.vue";
import {useChatStore} from "stores/chatStore";
import {Thread} from "src/util/chat/Thread";
import {useInfoStore} from "stores/infoStore";

const chatStore = useChatStore();
const infoStore = useInfoStore();
const activeThread: ComputedRef<Thread> = computed(() =>
													   chatStore.getActiveThread()
);

const sideMenuOpen = ref(false);

const toggleSideMenu = () => {
	sideMenuOpen.value = !sideMenuOpen.value;
};
</script>
