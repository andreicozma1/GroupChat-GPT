<template>
    <q-toolbar>
        <q-btn aria-label="Menu"
               dense
               flat
               icon="menu"
               round
               @click="toggleSideMenu"
        />

        <div class="q-px-md">
            <q-toolbar-title> {{ activeThread.name }}</q-toolbar-title>
        </div>

        <q-tabs v-if="infoStore.hasMessages"
                dense
                no-caps
                outside-arrows
                shrink>
            <q-tab v-for="item in infoStore.getMessages()"
                   :key="item.id"
                   class="q-px-none">
                <q-chip :icon="getChipIcon(item)"
                        size="12px">
                    {{ item.title }}
                </q-chip>

                <CustomTooltip v-if="item.caption">
                    {{ item.caption }}
                </CustomTooltip>
            </q-tab>
        </q-tabs>
        <q-space />

        <div class="q-pl-md">
            <ThreadPrefs />
        </div>
        <!--            <div class="q-ml-sm">Quasar v{{ $q.version }}</div>-->
    </q-toolbar>
</template>
<script lang="ts"
        setup>
import {InfoMessage, useInfoStore} from "stores/infoStore";
import {computed, ComputedRef} from "vue";
import {Thread} from "src/util/chat/Thread";
import {useChatStore} from "stores/chatStore";
import ThreadPrefs from "components/ThreadPrefs.vue";
import CustomTooltip from "components/CustomTooltip.vue";

const chatStore = useChatStore();

const infoStore = useInfoStore();
const activeThread: ComputedRef<Thread> = computed(() => chatStore.getActiveThread());

const emit = defineEmits(["onToggleDrawer"]);

const toggleSideMenu = () => {
	emit("onToggleDrawer");
};

const getChipIcon = (item: InfoMessage) => {
	if (isNotificationActive(item)) {
		return "notifications_active"
	}
	return "notifications"
}

const isNotificationActive = (item: InfoMessage) => {
	const dateCurr = new Date();
	return dateCurr.getTime() - item.dateUpdated.getTime() < 5000
};

</script>