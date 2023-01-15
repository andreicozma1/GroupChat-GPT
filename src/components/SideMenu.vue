<template>
    <q-list>
        <q-item-label header> Essential Links</q-item-label>

        <EssentialLink
                v-for="link in essentialLinks"
                :key="link.title"
                v-bind="link"
        />
    </q-list>
</template>
<script lang="ts" setup>
import EssentialLink, {EssentialLinkProps,} from "components/EssentialLink.vue";

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
</script>
