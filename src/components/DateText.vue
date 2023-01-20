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

const currentDateIdx = ref(0);
const dateTypeToggle = ref(false);


const onClick = () => {
	dateTypeToggle.value = !dateTypeToggle.value;
}

const onRightClick = () => {
	currentDateIdx.value = (currentDateIdx.value + 1) % dates.value.length;
}

const dateUpdateInterval: Ref<NodeJS.Timeout | null> = ref(null);

let timeoutMs = 1000;

const update = () => {
	const date = dates.value[currentDateIdx.value];
	let dateStr;

	if (dateUpdateInterval.value) clearTimeout(dateUpdateInterval.value);
	if (dateTypeToggle.value) {
		dateStr = dateToLocaleStr(date);
	} else {
		dateStr = dateToTimeAgo(date);
		dateUpdateInterval.value = setTimeout(update, timeoutMs);
	}

	if (props.prefix) dateStr = props.prefix + " " + dateStr;
	if (props.suffix) dateStr = dateStr + " " + props.suffix;

	if (text.value === dateStr) timeoutMs *= 1.25
	text.value = dateStr;
}

watchEffect(() => {
	dates.value = parseDateProps();
	update();
})


</script>