<template>
  <v-layout row wrap>
    <v-flex xs9 style="margin-left:35px;">
      <v-select v-model="contractSelect"
        :items="examples"
        solo
        class="body-1"
        item-value="id"
        item-text="name"
        item-disabled="disabled"
        placeholder="Load example contract"
        @change="onSelect"
      ></v-select>
    </v-flex>
  </v-layout>
</template>

<script>

import mevm from 'mevm';

export default {
  data() {
    return {
      contractSelect: null,
      examples: [
        {
          id: 0,
          name: 'empty contract',
          url: 'https://raw.githubusercontent.com/ajlopez/evmasm/master/samples/compile/empty.asm',
          filename: 'empty.asm',
        },
        {
          id: 1,
          name: 'counter',
          url: 'https://raw.githubusercontent.com/loredanacirstea/masm/master/client/public/examples/Counter.asm',
          filename: 'counter.asm',
        },
        {
          id: 2,
          name: 'macros github',
          url: mevm.url,
          save: true,
          filename: mevm.filename,
        },
        {
          id: 3,
          name: 'macros localStorage',
          key: mevm.key,
          disabled: !this.$store.dispatch('localfetch', mevm.key),
          filename: 'masm_macros_local.masm',
        },
      ],
    }
  },
  methods: {
    async onSelect(id) {
      const { remixclient } = this.$store.state;
      const {
        name, url, key, save, filename,
      } = this.examples[id];
      let source;
      if (url) {
        source = await this.$store.dispatch('remotefetch', {url, key});
      } else {
        source = await this.$store.dispatch('localfetch', key);
      }
      if (!source) return;
      const remixName = filename ? `browser/${filename}` : `browser/${name}.masm`;
      await remixclient.fileManager.setFile(remixName, source);
      await remixclient.fileManager.switchFile(remixName);
      await this.$store.dispatch('setCurrentFile', remixName);

      if (save) {
        this.$store.dispatch('setlocal', {key, source});
      }
    },
  },
};

</script>
