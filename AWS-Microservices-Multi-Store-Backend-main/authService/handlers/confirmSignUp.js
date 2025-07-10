const {
  CognitoIdentityProviderClient,
  ConfirmSignUpCommand,
  AdminGetUserCommand
} = require("@aws-sdk/client-cognito-identity-provider");

const UserModel = require('../models/UserModel');

const client = new CognitoIdentityProviderClient({ region: process.env.REGION });
const CLIENT_ID = process.env.CLIENT_ID;
const USER_POOL_ID = process.env.USER_POOL_ID;

exports.confirmSignUp = async (event) => {
  const { email, confirmationCode } = JSON.parse(event.body); // ✅ No fullName here

  const confirmParams = {
    ClientId: CLIENT_ID,
    Username: email,
    ConfirmationCode: confirmationCode,
  };

  try {
    // Step 1: Confirm sign-up
    await client.send(new ConfirmSignUpCommand(confirmParams));

    // // Step 2: Get Cognito user and extract sub
    // const userData = await client.send(
    //   new AdminGetUserCommand({ UserPoolId: USER_POOL_ID, Username: email })
    // );

    // const subAttr = userData.UserAttributes.find(attr => attr.Name === "sub");
    // const userId = subAttr?.Value;

    // if (!userId) {
    //   throw new Error("User ID (sub) not found in Cognito attributes.");
    // }

    // // ✅ Step 3: Update DynamoDB record by email
    // await UserModel.updateUserIdByEmail(email, userId);

    return {
      statusCode: 200,
      body: JSON.stringify({ msg: "User successfully confirmed and updated!" }),
      // body: JSON.stringify({ msg: "User successfully confirmed and updated!", userId }),
    };

  } catch (error) {
    return {
      statusCode: 400,
      body: JSON.stringify({ msg: 'Confirmation failed', error: error.message }),
    };
  }
};
