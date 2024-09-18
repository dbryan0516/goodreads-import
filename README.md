# GoodReads Importer for LazyLibrarian

This project provides a script to import books marked as "To Read" on GoodReads into LazyLibrarian.

## How it works

The script reads a CSV file exported from GoodReads, filters for the books marked as "To Read", and sends them for import into LazyLibrarian. If a "To Read" book is already in LazyLibrarian and marked as "Skipped", this script will mark it as "Wanted". After it has finished processing the file, it will send a forceBookSearch command to LL, making it start searching for all books marked "Wanted" immediately. 

LazyLibrarian defaults newly added books through the API as "Skipped". You can change this to "Wanted" in the settings.



The CSV file should be in the following format (Standard GoodReads Export as of 9/16/2024):

```csv
BookID,Title,Author,Author l-f,Additional Authors,ISBN,ISBN13,My Rating,Average Rating,Publisher,Binding,Number of Pages,Year Published,Original Publication Year,Date Read,Date Added,Bookshelves,Bookshelves with positions,Exclusive Shelf,My Review,Spoiler,Private Notes,Read Count,Recommended For,Recommended By,Owned Copies,Original Purchase Date,Original Purchase Location,Condition,Condition Description,BCID
```

## Usage

1. Clone the repo. Create a `.env` file, copy the contents of the `.env.example` file and fill in your values.
- `BASE_URL` the url you use to access LazyLibrarian. Likely http://localhost:5299 or http://192.168.X.X:5299
- `API_KEY` LazyLibrarian settings under Config > Interface > Startup. Enable API and Generate an API key and SAVE.
2. Export your GoodReads library as a CSV file using [GoodReads Export](https://www.goodreads.com/review/import)
3. Place the CSV file in the root directory.
4. Run `npm install` to install the packages needed for the script.
5. Run the script via `npm start`.
6. The script logs status messages to the console and outputs a file `output.csv` which is the input file plus additional fields.

## Requirements

- NPM
- Node v20.11.1 (lower versions may work also)

## Note

This script is designed to work with LazyLibrarian. Make sure LazyLibrarian is properly set up and running before using this script.

## Disclaimer

This script is provided as-is, and the developers are not responsible for any data loss or other issues. Always back up your data before running new scripts on it.