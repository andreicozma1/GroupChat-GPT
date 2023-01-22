<template>
    <q-header elevated>
        <Toolbar @onToggleDrawer="toggleSideMenu" />
    </q-header>

    <q-drawer v-model="sideMenuOpen"
              bordered
              elevated
    >
        <Drawer />
    </q-drawer>
</template>
<script lang="ts"
        setup>
import Drawer from "components/Drawer.vue";
import {onBeforeUnmount, onMounted, ref} from "vue";
import Toolbar from "components/Toolbar.vue";

const sideMenuOpen = ref(false);

const toggleSideMenu = () => {
	sideMenuOpen.value = !sideMenuOpen.value;
};

const keyboardShortcut = (event: KeyboardEvent) => {
	if (event.key === 'Escape') {
		sideMenuOpen.value = false;
	}
};

onMounted(() => {
	document.addEventListener('keydown', keyboardShortcut);
});

onBeforeUnmount(() => {
	document.removeEventListener('keydown', keyboardShortcut);
});

</script>
