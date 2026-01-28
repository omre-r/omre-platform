
function handleError(fn){
  return async (...args) => {
    try{
      return await fn(...args);
    }catch(err){
      console.error(err);
      return null;
    }
  };
}

// path: /
let getServerHTML = function (req, res){
    res.send("Welcome to the server!");
};

getServerHTML = handleError(getServerHTML);


module.exports = {getServerHTML};