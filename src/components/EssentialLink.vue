<template>
    <q-item :href="link" clickable tag="a" target="_blank">
        <q-item-section v-if="icon" avatar>
            <q-icon :name="icon"/>
        </q-item-section>

        <q-item-section>
            <q-item-label>{{ title }}</q-item-label>
            <q-item-label caption>{{ caption }}</q-item-label>
        </q-item-section>
    </q-item>
</template>

<script lang="ts" setup>
export interface EssentialLinkProps {
	title: string;
	caption?: string;
	link?: string;
	icon?: string;
}

withDefaults(defineProps<EssentialLinkProps>(), {
	caption: "",
	link   : "#",
	icon   : ""
})
</script>
