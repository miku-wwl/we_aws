exports.anotherGreet = async (event)=>{
  try {

    const body = JSON.parse(event.body);


    const name = body.name;

    if(!name){
      return {
        statusCode:400,
        body:JSON.stringify({
            msg: "Name is required",
        })
      }
    };


    return {
        statusCode: 200,
        body:JSON.stringify({
            msg: `Hello, ${name}! welcomde!`
        })
    };


  } catch (error) {
    return {
        statusCode: 500,
        body:JSON.stringify({
            msg: 'An error Occured while processing your request!'
        })
    };
  }
}