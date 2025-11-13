import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.action.upsert({
    where: { name: 'new_row_added' },
    update: {
      description: 'Triggered when a new row is added to a spreadsheet',
      configSchema: {
        parameters: [
          { name: 'spreadsheetId', type: 'string', required: false, description: 'Filter by specific spreadsheet ID' },
          { name: 'sheetName', type: 'string', required: false, description: 'Filter by specific sheet name' }
        ],
        output: [
          { name: 'spreadsheetId', type: 'string', required: true, description: 'ID of the spreadsheet' },
          { name: 'spreadsheetName', type: 'string', required: true, description: 'Name of the spreadsheet' },
          { name: 'sheetName', type: 'string', required: true, description: 'Name of the sheet' },
          { name: 'rowData', type: 'array', required: true, description: 'Array of cell values in the new row' },
          { name: 'rowIndex', type: 'number', required: true, description: 'Index of the added row' }
        ]
      }
    },
    create: {
      name: 'new_row_added',
      description: 'Triggered when a new row is added to a spreadsheet',
      configSchema: {
        parameters: [
          { name: 'spreadsheetId', type: 'string', required: false, description: 'Filter by specific spreadsheet ID' },
          { name: 'sheetName', type: 'string', required: false, description: 'Filter by specific sheet name' }
        ],
        output: [
          { name: 'spreadsheetId', type: 'string', required: true, description: 'ID of the spreadsheet' },
          { name: 'spreadsheetName', type: 'string', required: true, description: 'Name of the spreadsheet' },
          { name: 'sheetName', type: 'string', required: true, description: 'Name of the sheet' },
          { name: 'rowData', type: 'array', required: true, description: 'Array of cell values in the new row' },
          { name: 'rowIndex', type: 'number', required: true, description: 'Index of the added row' }
        ]
      }
    }
  });

  await prisma.action.upsert({
    where: { name: 'spreadsheet_created' },
    update: {
      description: 'Triggered when a new spreadsheet is created',
      configSchema: {
        parameters: [],
        output: [
          { name: 'spreadsheetId', type: 'string', required: true, description: 'ID of the new spreadsheet' },
          { name: 'spreadsheetName', type: 'string', required: true, description: 'Name of the spreadsheet' },
          { name: 'spreadsheetUrl', type: 'string', required: true, description: 'URL to the spreadsheet' }
        ]
      }
    },
    create: {
      name: 'spreadsheet_created',
      description: 'Triggered when a new spreadsheet is created',
      configSchema: {
        parameters: [],
        output: [
          { name: 'spreadsheetId', type: 'string', required: true, description: 'ID of the new spreadsheet' },
          { name: 'spreadsheetName', type: 'string', required: true, description: 'Name of the spreadsheet' },
          { name: 'spreadsheetUrl', type: 'string', required: true, description: 'URL to the spreadsheet' }
        ]
      }
    }
  });

  await prisma.action.upsert({
    where: { name: 'cell_updated' },
    update: {
      description: 'Triggered when a cell value is updated',
      configSchema: {
        parameters: [
          { name: 'spreadsheetId', type: 'string', required: false, description: 'Filter by specific spreadsheet ID' },
          { name: 'cellRange', type: 'string', required: false, description: 'Filter by specific cell range (e.g., A1)' }
        ],
        output: [
          { name: 'spreadsheetId', type: 'string', required: true, description: 'ID of the spreadsheet' },
          { name: 'sheetName', type: 'string', required: true, description: 'Name of the sheet' },
          { name: 'cellRange', type: 'string', required: true, description: 'Cell range that was updated' },
          { name: 'oldValue', type: 'string', required: false, description: 'Previous cell value' },
          { name: 'newValue', type: 'string', required: true, description: 'New cell value' }
        ]
      }
    },
    create: {
      name: 'cell_updated',
      description: 'Triggered when a cell value is updated',
      configSchema: {
        parameters: [
          { name: 'spreadsheetId', type: 'string', required: false, description: 'Filter by specific spreadsheet ID' },
          { name: 'cellRange', type: 'string', required: false, description: 'Filter by specific cell range (e.g., A1)' }
        ],
        output: [
          { name: 'spreadsheetId', type: 'string', required: true, description: 'ID of the spreadsheet' },
          { name: 'sheetName', type: 'string', required: true, description: 'Name of the sheet' },
          { name: 'cellRange', type: 'string', required: true, description: 'Cell range that was updated' },
          { name: 'oldValue', type: 'string', required: false, description: 'Previous cell value' },
          { name: 'newValue', type: 'string', required: true, description: 'New cell value' }
        ]
      }
    }
  });

  await prisma.reaction.upsert({
    where: { name: 'create_spreadsheet' },
    update: {
      description: 'Create a new Google Sheets spreadsheet',
      configSchema: {
        parameters: [
          { name: 'title', type: 'string', required: true, description: 'Title of the new spreadsheet' }
        ]
      }
    },
    create: {
      name: 'create_spreadsheet',
      description: 'Create a new Google Sheets spreadsheet',
      configSchema: {
        parameters: [
          { name: 'title', type: 'string', required: true, description: 'Title of the new spreadsheet' }
        ]
      }
    }
  });

  await prisma.reaction.upsert({
    where: { name: 'add_row' },
    update: {
      description: 'Append a new row to a spreadsheet',
      configSchema: {
        parameters: [
          { name: 'spreadsheetId', type: 'string', required: true, description: 'ID of the spreadsheet' },
          { name: 'sheetName', type: 'string', required: false, description: 'Name of the sheet (defaults to Sheet1)' },
          { name: 'rowData', type: 'string', required: true, description: 'Object containing the data to append. Keys will be ignored, only values will be appended in order.' }
        ]
      }
    },
    create: {
      name: 'add_row',
      description: 'Append a new row to a spreadsheet',
      configSchema: {
        parameters: [
          { name: 'spreadsheetId', type: 'string', required: true, description: 'ID of the spreadsheet' },
          { name: 'sheetName', type: 'string', required: false, description: 'Name of the sheet (defaults to Sheet1)' },
          { name: 'rowData', type: 'string', required: true, description: 'Object containing the data to append. Keys will be ignored, only values will be appended in order.' }
        ]
      }
    }
  });

  await prisma.reaction.upsert({
    where: { name: 'write_in_cell' },
    update: {
      description: 'Update a specific cell value',
      configSchema: {
        parameters: [
          { name: 'spreadsheetId', type: 'string', required: true, description: 'ID of the spreadsheet' },
          { name: 'range', type: 'string', required: true, description: 'Cell range (e.g., Sheet1!A1)' },
          { name: 'value', type: 'string', required: true, description: 'New value for the cell' }
        ]
      }
    },
    create: {
      name: 'write_in_cell',
      description: 'Update a specific cell value',
      configSchema: {
        parameters: [
          { name: 'spreadsheetId', type: 'string', required: true, description: 'ID of the spreadsheet' },
          { name: 'range', type: 'string', required: true, description: 'Cell range (e.g., Sheet1!A1)' },
          { name: 'value', type: 'string', required: true, description: 'New value for the cell' }
        ]
      }
    }
  });

  await prisma.reaction.upsert({
    where: { name: 'read_in_range' },
    update: {
      description: 'Read data from a specific range',
      configSchema: {
        parameters: [
          { name: 'spreadsheetId', type: 'string', required: true, description: 'ID of the spreadsheet' },
          { name: 'range', type: 'string', required: true, description: 'Range to read (e.g., Sheet1!A1:C10)' }
        ]
      }
    },
    create: {
      name: 'read_in_range',
      description: 'Read data from a specific range',
      configSchema: {
        parameters: [
          { name: 'spreadsheetId', type: 'string', required: true, description: 'ID of the spreadsheet' },
          { name: 'range', type: 'string', required: true, description: 'Range to read (e.g., Sheet1!A1:C10)' }
        ]
      }
    }
  });

  await prisma.reaction.upsert({
    where: { name: 'create_sheet' },
    update: {
      description: 'Create a new sheet in an existing spreadsheet',
      configSchema: {
        parameters: [
          { name: 'spreadsheetId', type: 'string', required: true, description: 'ID of the spreadsheet' },
          { name: 'sheetTitle', type: 'string', required: true, description: 'Title for the new sheet' }
        ]
      }
    },
    create: {
      name: 'create_sheet',
      description: 'Create a new sheet in an existing spreadsheet',
      configSchema: {
        parameters: [
          { name: 'spreadsheetId', type: 'string', required: true, description: 'ID of the spreadsheet' },
          { name: 'sheetTitle', type: 'string', required: true, description: 'Title for the new sheet' }
        ]
      }
    }
  });

  await prisma.reaction.upsert({
    where: { name: 'clear_in_range' },
    update: {
      description: 'Clear data from a specific range',
      configSchema: {
        parameters: [
          { name: 'spreadsheetId', type: 'string', required: true, description: 'ID of the spreadsheet' },
          { name: 'range', type: 'string', required: true, description: 'Range to clear (e.g., Sheet1!A1:C10)' }
        ]
      }
    },
    create: {
      name: 'clear_in_range',
      description: 'Clear data from a specific range',
      configSchema: {
        parameters: [
          { name: 'spreadsheetId', type: 'string', required: true, description: 'ID of the spreadsheet' },
          { name: 'range', type: 'string', required: true, description: 'Range to clear (e.g., Sheet1!A1:C10)' }
        ]
      }
    }
  });

  await prisma.reaction.upsert({
    where: { name: 'duplicate_sheet' },
    update: {
      description: 'Duplicate an entire spreadsheet',
      configSchema: {
        parameters: [
          { name: 'spreadsheetId', type: 'string', required: true, description: 'ID of the spreadsheet to duplicate' },
          { name: 'newTitle', type: 'string', required: true, description: 'Title for the duplicated spreadsheet' }
        ]
      }
    },
    create: {
      name: 'duplicate_sheet',
      description: 'Duplicate an entire spreadsheet',
      configSchema: {
        parameters: [
          { name: 'spreadsheetId', type: 'string', required: true, description: 'ID of the spreadsheet to duplicate' },
          { name: 'newTitle', type: 'string', required: true, description: 'Title for the duplicated spreadsheet' }
        ]
      }
    }
  });

  await prisma.reaction.upsert({
    where: { name: 'find_to_replace' },
    update: {
      description: 'Find and replace text in a spreadsheet',
      configSchema: {
        parameters: [
          { name: 'spreadsheetId', type: 'string', required: true, description: 'ID of the spreadsheet' },
          { name: 'find', type: 'string', required: true, description: 'Text to find' },
          { name: 'replacement', type: 'string', required: true, description: 'Replacement text' },
          { name: 'sheetId', type: 'number', required: false, description: 'Specific sheet ID (optional, searches all sheets if not provided)' }
        ]
      }
    },
    create: {
      name: 'find_to_replace',
      description: 'Find and replace text in a spreadsheet',
      configSchema: {
        parameters: [
          { name: 'spreadsheetId', type: 'string', required: true, description: 'ID of the spreadsheet' },
          { name: 'find', type: 'string', required: true, description: 'Text to find' },
          { name: 'replacement', type: 'string', required: true, description: 'Replacement text' },
          { name: 'sheetId', type: 'number', required: false, description: 'Specific sheet ID (optional, searches all sheets if not provided)' }
        ]
      }
    }
  });

  await prisma.reaction.upsert({
    where: { name: 'sort_data_in_range' },
    update: {
      description: 'Sort a range of data',
      configSchema: {
        parameters: [
          { name: 'spreadsheetId', type: 'string', required: true, description: 'ID of the spreadsheet' },
          { name: 'sheetId', type: 'number', required: false, description: 'Sheet ID (defaults to 0)' },
          { name: 'range', type: 'string', required: true, description: 'Range in A1 notation (e.g., A1:C10)' },
          { name: 'sortColumn', type: 'string', required: false, description: 'Column to sort by in A1 notation (e.g., B). Defaults to first column of range' },
          { name: 'ascending', type: 'boolean', required: false, description: 'Sort ascending (defaults to true)' }
        ]
      }
    },
    create: {
      name: 'sort_data_in_range',
      description: 'Sort a range of data',
      configSchema: {
        parameters: [
          { name: 'spreadsheetId', type: 'string', required: true, description: 'ID of the spreadsheet' },
          { name: 'sheetId', type: 'number', required: false, description: 'Sheet ID (defaults to 0)' },
          { name: 'range', type: 'string', required: true, description: 'Range in A1 notation (e.g., A1:C10)' },
          { name: 'sortColumn', type: 'string', required: false, description: 'Column to sort by in A1 notation (e.g., B). Defaults to first column of range' },
          { name: 'ascending', type: 'boolean', required: false, description: 'Sort ascending (defaults to true)' }
        ]
      }
    }
  });
  console.log('Google Sheets seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
