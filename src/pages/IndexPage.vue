<template>
    <q-page :style-fn="styleFn">
        <ChatThread :scroll-area-style="scrollAreaStyle" />
        <ChatInputs ref="chatInputsRef" />
    </q-page>
</template>

<script lang="ts"
        setup>
import {ref, watchEffect} from "vue";
import ChatInputs from "components/ChatInputs.vue";
import ChatThread from "components/ChatThread.vue";

const chatInputsRef = ref(null);
const scrollAreaStyle = ref({
								bottom: '0px',
							});

const styleFn = (offset: number, height: number) => {
	const pageheight = height - offset;
	return "height: " + pageheight + "px";
}

const resizeObserver = new ResizeObserver((entries) => {
	console.log("resizeObserver->entries:", entries);
	const newHeight = entries[0]?.contentRect?.height;
	if (!newHeight) {
		console.error("resizeObserver->newHeight:", newHeight);
		return;
	}

	scrollAreaStyle.value = {bottom: newHeight + "px"}
	console.log(scrollAreaStyle.value);
});

watchEffect(() => {
	if (chatInputsRef.value) {
		resizeObserver.observe(chatInputsRef.value.$el);
	}
});


</script>
