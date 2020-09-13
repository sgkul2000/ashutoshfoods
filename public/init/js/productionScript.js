(function(){
 
    var _z = console;
    Object.defineProperty( window, "console", {
          get : function(){
              if( _z._commandLineAPI ){
              throw "Dev Tools have been blocked!";
                    }
              return _z; 
          },
          set : function(val){
              _z = val;
          }
    });
   
  })();
  
window.console.log = function(){
    console.error('Dev Tools have been blocked!');
    window.console.log = function() {
        return false;
    }
  }
  