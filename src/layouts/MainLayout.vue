<template>
    <q-layout view="lHh Lpr lFf">
        <AppBarLayout />

        <q-page-container>
            <router-view />
        </q-page-container>
    </q-layout>
</template>

<script lang="ts"
        setup>
import AppBarLayout from "layouts/AppBarLayout.vue";</script>
