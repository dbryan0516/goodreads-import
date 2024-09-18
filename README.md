# GoodReads Importer for LazyLibrarian

This project provides a script to import books marked as "To Read" on GoodReads into LazyLibrarian.

## How it works

The script reads a CSV file exported from GoodReads, filters for the books marked as "To Read", and prepares them for import into LazyLibrarian.

The CSV file should be in the following format (Standard GoodReads Export as of 9/16/2024):

```csv
BookID,Title,Author,Author l-f,Additional Authors,ISBN,ISBN13,My Rating,Average Rating,Publisher,Binding,Number of Pages,Year Published,Original Publication Year,Date Read,Date Added,Bookshelves,Bookshelves with positions,Exclusive Shelf,My Review,Spoiler,Private Notes,Read Count,Recommended For,Recommended By,Owned Copies,Original Purchase Date,Original Purchase Location,Condition,Condition Description,BCID
```

## Usage

1. Export your GoodReads library as a CSV file using [GoodReads Export](https://www.goodreads.com/review/import)
2. Place the CSV file in the root directory.
3. Create a `.env` file, copy the contents of the `.env.example` file and fill in your values.
4. Run the script via `npm start`.
5. The script logs status messages to the console and outputs a file `output.csv` which is the input file plus additional fields.

## Requirements

- NPM
- Node v20.11.1 (lower versions may work also)

## Note

This script is designed to work with LazyLibrarian. Make sure LazyLibrarian is properly set up and running before using this script.

## Disclaimer

This script is provided as-is, and the developers are not responsible for any data loss or other issues. Always back up your data before running new scripts on it.