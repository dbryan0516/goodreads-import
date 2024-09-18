const fs = require('fs');
const axios = require('axios');
const path = require('path');
// use dotenv to load environment variables from .env file
require('dotenv').config();
const inputFile = './goodreads_library_export.csv';
const outputFile = './output.csv';

const baseUrl = process.env.BASE_URL || 'http://localhost:5299';
const apiKey = process.env.API_KEY;

if (!apiKey || apiKey === 'YOUR') {
  console.error('API_KEY not found in environment variables. Exiting.');
  process.exit(1);
}

// Class used to wait for a signal to quit from processes
// Neeeded to handle async script termination
class Waiter {
  constructor() {
    this.waitLoop()
  }
  waitLoop() {
    this.timeout = setTimeout(() => { this.waitLoop() }, 100 * 1000)
  }
  okToQuit() {
    clearTimeout(this.timeout)
  }
}

const fetchAllBooks = async () => {
  const fetchBooksApiUrl = `${baseUrl}/api?apikey=${apiKey}&cmd=getAllBooks`;
  try {
    const response = await axios.get(fetchBooksApiUrl);
    console.log('Done fetching books');
    return response.data;

  }
  catch (error) {
    console.error('Error fetching books: ', error.message);
    throw error;
  }
};

// Function to parse a single CSV line and handle quoted fields
function parseCSVLine(line) {
  const result = [];
  let currentValue = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote inside quotes, add it to current value and skip next quote
        currentValue += '"';
        i++;
      } else {
        // Toggle the inQuotes flag
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // If a comma is outside quotes, it's a column separator
      result.push(currentValue.trim());
      currentValue = '';
    } else {
      // Add character to the current value
      currentValue += char;
    }
  }

  // Add the last value
  result.push(currentValue.trim());
  return result;
}

// Function to parse the entire CSV file
function parseCSV(data) {
  const lines = data.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  const headers = parseCSVLine(lines[0]); // Parse headers
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const rowObject = {};

    // Create an object for each row, using headers as keys
    headers.forEach((header, index) => {
      rowObject[header] = values[index] || ''; // Assign value or empty string if missing
    });

    rows.push(rowObject);
  }
  console.log('Finished parsing CSV. Number of rows: ', rows.length);
  return { rows, headers };
}

const main = async () => {
  const addBookUrl = `${baseUrl}/api?apikey=${apiKey}&cmd=addBook`;

  const allBooks = await fetchAllBooks();
  if (allBooks.length === 0) {
    console.log('No books found from library. Continuing without comparing books.');
    return; // TODO: remove me
  }
  const results = [];
  const fileData = fs.readFileSync(path.resolve(__dirname, inputFile), 'utf-8');
  const parsedFileData = parseCSV(fileData);
  const rows = parsedFileData.rows;
  const headers = parsedFileData.headers;
  headers.push(['FoundInLibrary', 'LibraryStatus', 'Response', 'ResponseCode']);
  for (let i = 1; i < rows.length; i++) {
    const rowData = rows[i];
    console.log('Processing row: ', i, rowData['Book Id'], rowData['Title'], rowData['Author'], rowData['Exclusive Shelf']);
    if (rowData['Exclusive Shelf'] === 'to-read') {
      const bookId = rowData['Book Id'];
      if (!bookId) {
        console.log('Book ID not found for row: ', i);
        continue;
      }

      const book = allBooks.find((book) => book.BookID === bookId);
      rowData['FoundInLibrary'] = book ? 'Yes' : 'No';
      rowData['LibraryStatus'] = book ? book.Status : 'Not Found';

      if (book && ['Wanted', 'Open', 'Snatched'].includes(book.Status)) {
        console.log('Book already found in Library: ', book.BookID, book.BookName, book.AuthorName);
        continue;
      } else if (book && book.Status === 'Skipped') {
        // make api call to mark wanted
        const markWantedApiUrl = `${baseUrl}/api?apikey=${apiKey}&cmd=markWanted&id=${bookId}`;
        try {
          console.log('Book already found in Library but skipped: ', bookId, book.BookName, book.AuthorName);
          console.log('Queueing book: ', bookId);
          const response = await axios.get(markWantedApiUrl);
          rowData['Response'] = response.data; // Add response body to the row
          rowData['ResponseCode'] = response.status; // Add response status code to the row
        } catch (error) {
          const responseStatus = error.response.status;
          rowData['Response'] = error.response.data; // Add response body to the row
          rowData['ResponseCode'] = responseStatus; // Add response status code to the row
        }
        continue;
      }

      const apiUrlWithId = `${addBookUrl}&id=${bookId}`;
      try {
        console.log('Adding book to library: ', bookId);
        const response = await axios.get(apiUrlWithId);
        const responseBody = response.data;
        rowData['Response'] = responseBody; // Add response body to the row
        rowData['ResponseCode'] = response.status; // Add response status code to the row
      } catch (error) {
        const responseStatus = error.response.status;
        rowData['Response'] = error.response.data; // Add response body to the row
        rowData['ResponseCode'] = responseStatus; // Add response status code to the row
      }
    }
    results.push(rowData);
  }
  // force search for new books
  const forceApiUrl = `${baseUrl}/api?apikey=${apiKey}&cmd=forceBookSearch`;
  try {
    console.log('Forcing search for new books');
    const response = await axios.get(forceApiUrl);
    console.log('Response from force search: ', response.data);
  } catch (error) {
    console.error('Error forcing search for new books: ', error.message);
  }

  try {
    fs.writeFileSync(outputFile, headers.join(',') + '\n');
    for (let i = 0; i < results.length; i++) {
      const row = results[i];
      const rowValues = Object.values(row);
      // wrap row value in quotes
      for (let j = 0; j < rowValues.length; j++) {
        rowValues[j] = `"${rowValues[j]}"`;
      }
      fs.appendFileSync(outputFile, rowValues.join(',') + '\n');
    }
  } catch (error) {
    console.error('Error writing to output file: ', error.message);
  }
};

const w = new Waiter();
process.on('SIGINT', () => {
  console.log('Caught interrupt signal');
  w.okToQuit();
  process.exit();
});

main().catch((error) => {
  console.log('Error in main function');
  console.error(error);
}).finally(() => {
  w.okToQuit();
  process.exit();
});
