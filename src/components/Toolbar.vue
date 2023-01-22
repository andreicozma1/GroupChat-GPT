<template>
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

        <ThreadPrefs />
        <!--            <div class="q-ml-sm">Quasar v{{ $q.version }}</div>-->
    </q-toolbar>
</template>
<script lang="ts"
        setup>
import {useInfoStore} from "stores/infoStore";
import {computed, ComputedRef} from "vue";
import {Thread} from "src/util/chat/Thread";
import {useChatStore} from "stores/chatStore";
import ThreadPrefs from "components/ThreadPrefs.vue";

const chatStore = useChatStore();

const infoStore = useInfoStore();
const activeThread: ComputedRef<Thread> = computed(() =>
													   chatStore.getActiveThread()
);

const emit = defineEmits(["onToggleDrawer"]);

const toggleSideMenu = () => {
	emit("onToggleDrawer");
};


</script>