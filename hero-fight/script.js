// Tab switching for the code explorer
document.querySelectorAll('.tab').forEach(function(tab) {
    tab.addEventListener('click', function() {
        document.querySelectorAll('.tab').forEach(function(t) { t.classList.remove('active'); });
        document.querySelectorAll('.code-panel').forEach(function(p) { p.classList.remove('active'); });
        tab.classList.add('active');
        var panel = document.getElementById('tab-' + tab.dataset.tab);
        if (panel) panel.classList.add('active');
    });
});

// Initialize highlight.js on all code blocks
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('pre code').forEach(function(block) {
        hljs.highlightElement(block);
    });
});
