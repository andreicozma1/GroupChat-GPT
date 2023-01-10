<template>
    <q-layout view="lHh Lpr lFf">
        <AppBar/>

        <q-page-container>
            <router-view/>
        </q-page-container>
    </q-layout>
</template>

<script lang="ts" setup>
import AppBar from "layouts/AppBar.vue";</script>
