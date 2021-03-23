module.exports = function (Handlebars) {
    Handlebars.registerHelper("setVar", function(varName, varValue, options) {
        options.data.root[varName] = varValue;
    });
}