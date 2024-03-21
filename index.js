const express = require('express');
const axios = require('axios');
var mysql = require('mysql');
const app = express();
const cors = require('cors');
const insertSubmission = require('./submission');
const connection = require('./connection');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const URL = 'https://code-editor-gules-two.vercel.app'

app.use(cors(
  {
  origin: URL,
  methods: ["GET", "POST"],
  credentials: true
  }
));

// Connect to the MySQL database
connection.connect((err) => {
  if (err) {
    console.error('Errorconnecting to MySQL database: ' + err.stack);
    return;
  }
  console.log('Connected to MySQL database as id ' + connection.threadId);
});



app.get('/', (req, res) => {
  return res.json({ hello: "world" });
});

app.post('/run', async (req, res) => {
  const { language_id, code, username, stdin } = req.body;

  if (!language_id || !code || !username || !stdin) {
      return res.status(400).json({ success: false, message: "unfilled data" });
  }

  let language = 52; // Default language_id

  if (language_id === 'cpp') {
      language = 52;
  } else if (language_id === 'java') {
      language = 91;
  } else if (language_id === 'python') {
      language = 71;
  } else if (language_id === 'javascript') {
      language = 93;
  }

  // Encoding code and stdin to base64
  const Code = Buffer.from(code).toString('base64');
  const Stdin = Buffer.from(stdin).toString('base64');

  const options = {
      method: 'POST',
      url: 'https://judge0-ce.p.rapidapi.com/submissions',
      params: {
          base64_encoded: 'true',
          wait: 'true', // Change to 'true' to wait for submission status
          fields: '*'
      },
      headers: {
          'content-type': 'application/json',
          'X-RapidAPI-Key': '6cf9847e81mshee316bea0e7ad6dp1289a6jsn7a41c011db9d',
          'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
      },
      data: {
          language_id: language,
          source_code: Code,
          stdin: Stdin
      }
  };

  try {
      const response = await axios.request(options);
      console.log("entering data",response.data)
      const time=response.data.created_at;
      const token = response.data.token;

      if (!token) {
          return res.status(400).json({ success: false, message: "Invalid token" });
      }

      const submissionOptions = {
          method: 'GET',
          url: `https://judge0-ce.p.rapidapi.com/submissions/${token}`,
          params: {
              base64_encoded: 'true',
              fields: '*'
          },
          headers: {
              'X-RapidAPI-Key': '6cf9847e81mshee316bea0e7ad6dp1289a6jsn7a41c011db9d',
              'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
          }
      };

      let submissionData = null;
      while (true) {
          const submissionResponse = await axios.request(submissionOptions);
          submissionData = submissionResponse.data;

          if (submissionData.status.id === 2) { // If status is "Processing", continue waiting
              await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for 1 second before checking again
          } else {
              break; // If status is not "Processing", exit the loop
          }
      }

      console.log("putting data",submissionData);
       console.log(time);
      insertSubmission(submissionData, username,time);
      res.status(200).json(submissionData);
      }
       catch (error) {
      console.error(error);
      return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});


app.get('/response', async (req, res) => {
  const {username} = req.query;

  if (!username) {
    return res.status(400).json({ success: false, message: "Invalid token" });
  }

  try {
    connection.query("SELECT * FROM submission WHERE username = ?", username,function(error, result) {
      if (error) {
        throw error;
      }
      
      if (!result || result.length === 0) {
        console.log('Response data is null or empty, calling submit again');
        return res.status(404).json({ success: false, message: "Data not found" });
      }
      
      return res.json(result);
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Failed to get data" });
  }
})





app.listen(process.env.PORT, () => {
  console.log('Server is running on port 4000');
});
