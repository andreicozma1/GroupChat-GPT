<template>
    <q-item-label :lines="1"
                  caption
                  class="q-px-xs q-my-auto"
                  style="cursor: pointer"
                  @click.stop="onClick"
                  @click.right.stop="onRightClick">
        {{ text }}
    </q-item-label>

</template>

<script lang="ts"
        setup>

import {dateToLocaleStr, dateToTimeAgo, parseDate, ValidDateTypes} from "../util/DateUtils";
import {PropType, Ref, ref, watchEffect} from "vue";

const props = defineProps({
	modelValue: {
		// also allow undefined
		type: [String, Number, Date] as PropType<ValidDateTypes>,
		required: false
	},
	prefix: {
		type: String,
		required: false,
	},
	suffix: {
		type: String,
		required: false,
	}
});

const parseDateProps = (): Date[] => {
	const res = Array.isArray(props.modelValue) ? props.modelValue : [props.modelValue];
	return res.map((val) => parseDate(val));
}
const dates: Ref<Date[]> = ref(parseDateProps())

const text = ref("");

const toggleState = ref(0);
const dateTypeToggle = ref(false);


const onClick = () => {
	dateTypeToggle.value = !dateTypeToggle.value;
}

const onRightClick = () => {
	toggleState.value = (toggleState.value + 1) % dates.value.length;
}

watchEffect(() => {
	dates.value = parseDateProps();
	const date = dates.value[toggleState.value];
	let dateStr;

	if (date) {
		const timeAgo = dateToTimeAgo(date);
		const localeStr = dateToLocaleStr(date);
		dateStr = dateTypeToggle.value ? localeStr : timeAgo;
	} else {
		dateStr = "Unknown";
	}
	if (props.prefix) dateStr = props.prefix + " " + dateStr;
	if (props.suffix) dateStr = dateStr + " " + props.suffix;
	text.value = dateStr;
})

</script>