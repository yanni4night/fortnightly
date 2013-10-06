if(String.prototype.trim===undefined)
{
    String.prototype.trim=function(){return this.replace(/(^\s+|\s+$)/g,"")}
}

window.Utils={
        loadScript: function(src, callback) {
            var domScript = document.createElement('script');
            domScript.src = src;
            callback = callback || function() {};
            domScript.onload = domScript.onreadystatechange = function() {
                if (!this.readyState || 'loaded' === this.readyState || 'complete' === this.readyState) {
                    callback();
                    this.onload = this.onreadystatechange = null;
                    this.parentNode.removeChild(this);
                }
            }
            document.head.appendChild(domScript);
        }

};