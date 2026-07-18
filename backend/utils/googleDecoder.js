const { GoogleDecoder } = require("google-news-url-decoder");

const decoder = new GoogleDecoder();

exports.decodeUrl = async (googleUrl) => {
  try {

    console.log("INPUT:", googleUrl);

    const result = await decoder.decodeUrl(googleUrl);

    console.log("RESULT:", result);

    return result.url;

  } catch (err) {

    console.log(err);

    return googleUrl;

  }
};