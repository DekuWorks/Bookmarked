module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    // babel-preset-expo already appends react-native-worklets/plugin as its last
    // plugin once react-native-worklets is installed. Listing it again runs the
    // worklet transform twice and the second pass can touch the bridge before
    // MessageQueue exists ("[runtime not ready]").
  };
};
