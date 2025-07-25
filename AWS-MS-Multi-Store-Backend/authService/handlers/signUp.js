const { CognitoIdentityProviderClient, SignUpCommand } = require('@aws-sdk/client-cognito-identity-provider');
const UserModel = require('../models/UserModel');

const client = new CognitoIdentityProviderClient({ region: process.env.REGION });
const CLIENT_ID = process.env.CLIENT_ID;

exports.signUp = async (event) => {
  const { email, password, fullName } = JSON.parse(event.body);

  const params = {
    ClientId: CLIENT_ID,
    Username: email,
    Password: password,
    UserAttributes: [
      { Name: 'email', Value: email },
      { Name: 'name', Value: fullName },
    ],
  };

  try {
    const command = new SignUpCommand(params);
    await client.send(command);

    const newUser = new UserModel(email, fullName); 
    await newUser.save();

    return {
      statusCode: 200,
      body: JSON.stringify({ msg: "Account created, please verify your email!" }),
    };
  } catch (error) {
    return {
      statusCode: 400,
      body: JSON.stringify({ msg: 'Sign-up failed', error: error.message }),
    };
  }
};
