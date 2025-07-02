exports.hello = async (event) => {
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "Go weilai wang Serverless v4! Your function executed successfully!",
    }),
  };
};
