"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
exports.id = "vendor-chunks/@radix-ui+react-primitive@2.0.2_@types+react-dom@18.3.5_@types+react@18.3.18__@types+react@18_7bkiaclszdhxavocff63b4susy";
exports.ids = ["vendor-chunks/@radix-ui+react-primitive@2.0.2_@types+react-dom@18.3.5_@types+react@18.3.18__@types+react@18_7bkiaclszdhxavocff63b4susy"];
exports.modules = {

/***/ "(ssr)/../../node_modules/.pnpm/@radix-ui+react-primitive@2.0.2_@types+react-dom@18.3.5_@types+react@18.3.18__@types+react@18_7bkiaclszdhxavocff63b4susy/node_modules/@radix-ui/react-primitive/dist/index.mjs":
/*!***************************************************************************************************************************************************************************************************************!*\
  !*** ../../node_modules/.pnpm/@radix-ui+react-primitive@2.0.2_@types+react-dom@18.3.5_@types+react@18.3.18__@types+react@18_7bkiaclszdhxavocff63b4susy/node_modules/@radix-ui/react-primitive/dist/index.mjs ***!
  \***************************************************************************************************************************************************************************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   Primitive: () => (/* binding */ Primitive),\n/* harmony export */   Root: () => (/* binding */ Root),\n/* harmony export */   dispatchDiscreteCustomEvent: () => (/* binding */ dispatchDiscreteCustomEvent)\n/* harmony export */ });\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ \"(ssr)/../../node_modules/.pnpm/next@15.2.3_@opentelemetry+api@1.9.0_@playwright+test@1.51.0_react-dom@19.0.0_react@19.0.0__react@19.0.0/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js\");\n/* harmony import */ var react_dom__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react-dom */ \"(ssr)/../../node_modules/.pnpm/next@15.2.3_@opentelemetry+api@1.9.0_@playwright+test@1.51.0_react-dom@19.0.0_react@19.0.0__react@19.0.0/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-dom.js\");\n/* harmony import */ var _radix_ui_react_slot__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @radix-ui/react-slot */ \"(ssr)/../../node_modules/.pnpm/@radix-ui+react-slot@1.1.2_@types+react@18.3.18_react@19.0.0/node_modules/@radix-ui/react-slot/dist/index.mjs\");\n/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! react/jsx-runtime */ \"(ssr)/../../node_modules/.pnpm/next@15.2.3_@opentelemetry+api@1.9.0_@playwright+test@1.51.0_react-dom@19.0.0_react@19.0.0__react@19.0.0/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-runtime.js\");\n// packages/react/primitive/src/primitive.tsx\n\n\n\n\nvar NODES = [\n  \"a\",\n  \"button\",\n  \"div\",\n  \"form\",\n  \"h2\",\n  \"h3\",\n  \"img\",\n  \"input\",\n  \"label\",\n  \"li\",\n  \"nav\",\n  \"ol\",\n  \"p\",\n  \"span\",\n  \"svg\",\n  \"ul\"\n];\nvar Primitive = NODES.reduce((primitive, node) => {\n  const Node = react__WEBPACK_IMPORTED_MODULE_0__.forwardRef((props, forwardedRef) => {\n    const { asChild, ...primitiveProps } = props;\n    const Comp = asChild ? _radix_ui_react_slot__WEBPACK_IMPORTED_MODULE_3__.Slot : node;\n    if (typeof window !== \"undefined\") {\n      window[Symbol.for(\"radix-ui\")] = true;\n    }\n    return /* @__PURE__ */ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)(Comp, { ...primitiveProps, ref: forwardedRef });\n  });\n  Node.displayName = `Primitive.${node}`;\n  return { ...primitive, [node]: Node };\n}, {});\nfunction dispatchDiscreteCustomEvent(target, event) {\n  if (target) react_dom__WEBPACK_IMPORTED_MODULE_1__.flushSync(() => target.dispatchEvent(event));\n}\nvar Root = Primitive;\n\n//# sourceMappingURL=index.mjs.map\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHNzcikvLi4vLi4vbm9kZV9tb2R1bGVzLy5wbnBtL0ByYWRpeC11aStyZWFjdC1wcmltaXRpdmVAMi4wLjJfQHR5cGVzK3JlYWN0LWRvbUAxOC4zLjVfQHR5cGVzK3JlYWN0QDE4LjMuMThfX0B0eXBlcytyZWFjdEAxOF83YmtpYWNsc3pkaHhhdm9jZmY2M2I0c3VzeS9ub2RlX21vZHVsZXMvQHJhZGl4LXVpL3JlYWN0LXByaW1pdGl2ZS9kaXN0L2luZGV4Lm1qcyIsIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O0FBQUE7QUFDK0I7QUFDTztBQUNNO0FBQ0o7QUFDeEM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxlQUFlLDZDQUFnQjtBQUMvQixZQUFZLDZCQUE2QjtBQUN6QywyQkFBMkIsc0RBQUk7QUFDL0I7QUFDQTtBQUNBO0FBQ0EsMkJBQTJCLHNEQUFHLFNBQVMsc0NBQXNDO0FBQzdFLEdBQUc7QUFDSCxrQ0FBa0MsS0FBSztBQUN2QyxXQUFXO0FBQ1gsQ0FBQyxJQUFJO0FBQ0w7QUFDQSxjQUFjLGdEQUFrQjtBQUNoQztBQUNBO0FBS0U7QUFDRiIsInNvdXJjZXMiOlsiL1VzZXJzL2JlbmphbWluc2hhZmlpL2dpdC9oeXByLXYwL25vZGVfbW9kdWxlcy8ucG5wbS9AcmFkaXgtdWkrcmVhY3QtcHJpbWl0aXZlQDIuMC4yX0B0eXBlcytyZWFjdC1kb21AMTguMy41X0B0eXBlcytyZWFjdEAxOC4zLjE4X19AdHlwZXMrcmVhY3RAMThfN2JraWFjbHN6ZGh4YXZvY2ZmNjNiNHN1c3kvbm9kZV9tb2R1bGVzL0ByYWRpeC11aS9yZWFjdC1wcmltaXRpdmUvZGlzdC9pbmRleC5tanMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gcGFja2FnZXMvcmVhY3QvcHJpbWl0aXZlL3NyYy9wcmltaXRpdmUudHN4XG5pbXBvcnQgKiBhcyBSZWFjdCBmcm9tIFwicmVhY3RcIjtcbmltcG9ydCAqIGFzIFJlYWN0RE9NIGZyb20gXCJyZWFjdC1kb21cIjtcbmltcG9ydCB7IFNsb3QgfSBmcm9tIFwiQHJhZGl4LXVpL3JlYWN0LXNsb3RcIjtcbmltcG9ydCB7IGpzeCB9IGZyb20gXCJyZWFjdC9qc3gtcnVudGltZVwiO1xudmFyIE5PREVTID0gW1xuICBcImFcIixcbiAgXCJidXR0b25cIixcbiAgXCJkaXZcIixcbiAgXCJmb3JtXCIsXG4gIFwiaDJcIixcbiAgXCJoM1wiLFxuICBcImltZ1wiLFxuICBcImlucHV0XCIsXG4gIFwibGFiZWxcIixcbiAgXCJsaVwiLFxuICBcIm5hdlwiLFxuICBcIm9sXCIsXG4gIFwicFwiLFxuICBcInNwYW5cIixcbiAgXCJzdmdcIixcbiAgXCJ1bFwiXG5dO1xudmFyIFByaW1pdGl2ZSA9IE5PREVTLnJlZHVjZSgocHJpbWl0aXZlLCBub2RlKSA9PiB7XG4gIGNvbnN0IE5vZGUgPSBSZWFjdC5mb3J3YXJkUmVmKChwcm9wcywgZm9yd2FyZGVkUmVmKSA9PiB7XG4gICAgY29uc3QgeyBhc0NoaWxkLCAuLi5wcmltaXRpdmVQcm9wcyB9ID0gcHJvcHM7XG4gICAgY29uc3QgQ29tcCA9IGFzQ2hpbGQgPyBTbG90IDogbm9kZTtcbiAgICBpZiAodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgd2luZG93W1N5bWJvbC5mb3IoXCJyYWRpeC11aVwiKV0gPSB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gLyogQF9fUFVSRV9fICovIGpzeChDb21wLCB7IC4uLnByaW1pdGl2ZVByb3BzLCByZWY6IGZvcndhcmRlZFJlZiB9KTtcbiAgfSk7XG4gIE5vZGUuZGlzcGxheU5hbWUgPSBgUHJpbWl0aXZlLiR7bm9kZX1gO1xuICByZXR1cm4geyAuLi5wcmltaXRpdmUsIFtub2RlXTogTm9kZSB9O1xufSwge30pO1xuZnVuY3Rpb24gZGlzcGF0Y2hEaXNjcmV0ZUN1c3RvbUV2ZW50KHRhcmdldCwgZXZlbnQpIHtcbiAgaWYgKHRhcmdldCkgUmVhY3RET00uZmx1c2hTeW5jKCgpID0+IHRhcmdldC5kaXNwYXRjaEV2ZW50KGV2ZW50KSk7XG59XG52YXIgUm9vdCA9IFByaW1pdGl2ZTtcbmV4cG9ydCB7XG4gIFByaW1pdGl2ZSxcbiAgUm9vdCxcbiAgZGlzcGF0Y2hEaXNjcmV0ZUN1c3RvbUV2ZW50XG59O1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9aW5kZXgubWpzLm1hcFxuIl0sIm5hbWVzIjpbXSwiaWdub3JlTGlzdCI6WzBdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(ssr)/../../node_modules/.pnpm/@radix-ui+react-primitive@2.0.2_@types+react-dom@18.3.5_@types+react@18.3.18__@types+react@18_7bkiaclszdhxavocff63b4susy/node_modules/@radix-ui/react-primitive/dist/index.mjs\n");

/***/ })

};
;