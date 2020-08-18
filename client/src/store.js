import Vue from 'vue';
import Vuex from 'vuex';

import {createIframeClient} from '@remixproject/plugin';

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    remixclient: createIframeClient(),
    fileName: '',
    source: '',
    compiled: {},
    storageItems: {},
    backend: 'mevm',
  },
  mutations: {
    setState(state, {field, data}) {
      state[field] = data;
    },
    setBackend(state, value) {
      state.backend = value;
    },
  },
  actions: {
    setBackend({commit}, value) {
      console.log('store setBackend', value);
      commit('setState', {field: 'backend', data: value});
    },
    setCompiled({commit}, compiled) {
      commit('setState', {field: 'compiled', data: compiled});
    },
    listenCurrentFile({state, dispatch}) {
      const {remixclient} = state;
      remixclient.fileManager.on('currentFileChanged', (fileName) => {
        dispatch('setCurrentFile', fileName);
      });
    },
    async setCurrentFile({state, commit}, newFileName) {
      const {remixclient} = state;

      if (!newFileName) {
        newFileName = await remixclient.fileManager.getCurrentFile().catch(console.log);
      }
      // TODO error notification
      if (!newFileName) return;

      const source = await remixclient.fileManager.getFile(newFileName).catch(console.log);
      commit('setState', {field: 'fileName', data: newFileName});
      commit('setState', {field: 'source', data: source});
    },
    async remotefetch({dispatch}, {url, key}) {
      const response = await fetch(url).catch(console.log);
      const item = await response.text().catch(console.log);
      if (key) {
        dispatch('setlocal', {key, source: item});
      }
      return item;
    },
    localfetch({state, commit}, key) {
      const { storageItems } = state;
      storageItems[key] = localStorage.getItem(`mevm_${key}`);
      commit('setState', {field: 'storageItems', data: storageItems});
    },
    setlocal({state, commit}, {key, source}) {
      const { storageItems } = state;
      localStorage.setItem(`mevm_${key}`, source);
      storageItems[key] = source;
      commit('setState', {field: 'storageItems', data: storageItems});
    },
    remixfetch({state}, filename) {
      const {remixclient} = state;
      filename = `browser/${filename}`;
      return remixclient.fileManager.getFile(filename).catch(console.log);
    },
    async compileFile({state}, {name, source, backend}) {
      const {remixclient, fileName} = state;
      const settings = {
        evmVersion: null,
        optimize: true,
        language: 'Yul',
        version: '0.7.0+commit.9e61f92b',
      };

      if (backend === 'yulp') settings.version = '0.5.7+commit.6da8b019';
      if (backend === 'solc') settings.language = 'Solidity';

      const contract = {};
      contract[name || fileName] = {content: source };

      console.log('settings', settings);

      return remixclient.call('solidity', 'compileWithParameters', contract, settings);
    },
  },
});
