<template>
    <div class="full-width">
        <ChatThread :scroll-area-style="scrollAreaStyle"/>
        <ChatThreadForm ref="controlsCard"/>
    </div>
</template>

<script lang="ts" setup>
import {QCard} from "quasar";
import {computed, onMounted, Ref, ref, watch} from "vue";
import ChatThreadForm from "components/ChatThreadInputs.vue";
import ChatThread from "components/ChatThread.vue";

const controlsCard: Ref<QCard | null> = ref(null);
const scrollAreaStyle = ref({});

const userMsgStr = ref("");
const userMsgValid = computed(() => {
	return userMsgStr.value.trim().length > 0;
});

const isTyping = ref(false);
const isTypingTimeout: Ref<any> = ref(null);


const updateScrollAreaStyle = () => {
	setTimeout(() => {
		let controlsHeight = 0;
		if (controlsCard.value)
			controlsHeight = controlsCard.value.$el.clientHeight;
		const newStyle = {bottom: controlsHeight + "px"};
		if (newStyle.bottom !== scrollAreaStyle.value.bottom) {
			scrollAreaStyle.value = newStyle;
		}
	}, 100);
};

watch(userMsgStr, () => {
	updateScrollAreaStyle();
	// introduce a delay to detect if the user is typing.
	// The coordinator will not be called until the user stops typing for a while.
	isTyping.value = true;
	if (isTypingTimeout.value) clearTimeout(isTypingTimeout.value);
	isTypingTimeout.value = setTimeout(
		() => (isTyping.value = false),
		userMsgValid.value ? 1000 : 250
	);
});

onMounted(() => {
	updateScrollAreaStyle();
});
</script>
