const { timeStamp } = require("console");
const connection = require("./connection");
//const  nanoid  = require("nanoid")
const crypto = require("crypto")
const insertSubmission = async (submissionData,username,time) => {
  
    console.log("submission date",submissionData)

    try {
        const sourceCode = Buffer.from(submissionData.source_code, 'base64').toString('utf-8');
        const stdin = Buffer.from(submissionData.stdin, 'base64').toString('utf-8');
        var stdout =null;
        
        if(submissionData.compile_output){
            stdout = Buffer.from(submissionData.compile_output, 'base64').toString('utf-8');
        }
        else{
         stdout = Buffer.from(submissionData.stdout, 'base64').toString('utf-8');
        }
        const query = `
    INSERT INTO submission (id, token, username, language, source_code, stdin, std_out,status,timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?,?)
`;

console.log(username);

  const value= crypto.randomUUID();
  //const createdAtDate = new Date(submissionData.created_at);
  const times= new Date(time).toISOString().slice(0, 19).replace('T', ' ');

  const values = [
    52,
    submissionData.token,
    username,
    submissionData.language.name,
    sourceCode,
    stdin,
    stdout,
    submissionData.status.description,
    times
];


        await connection.query(query, values);
        console.log('Submission inserted successfully');
    } catch (error) {
        console.error('Error inserting submission:', error);
    }
};

module.exports = insertSubmission;
