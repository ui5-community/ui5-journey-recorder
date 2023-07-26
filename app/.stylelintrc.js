module.exports = {
  "extends": "stylelint-config-standard-scss",
  "plugins": [
    "stylelint-scss"
  ],
  "rules": {
    "at-rule-no-unknown": null,
    "scss/at-rule-no-unknown": true,
    "scss/selector-no-redundant-nesting-selector": true,
    "indentation": 4,
    "selector-class-pattern": [
      "^([_a-z][a-z0-9]*)(-{0,2}[a-z0-9]+)*$",
      {
        "message": "Expected class selector to use hypen"
      }
    ],
    "selector-pseudo-element-no-unknown": [
      true, 
      { 
        "ignorePseudoElements": [
          "ng-deep"
        ] 
      }
    ]
  }
}