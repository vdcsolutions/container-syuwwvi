from pathlib import Path
import sys
import os
# Ensure you are adding the correct parent directory to the sys.path
current_dir = Path(__file__).resolve().parent
sys.path.append(str(current_dir.parent))

from app.database.io_operations import IOOperations
# Define the path for a temporary file used in tests
TEMP_FILE_PATH = 'temp_test_file.json'

def setup_function():
    """ Setup function to create a temporary JSON file before each test """
    sample_data = {"key": "value"}
    IOOperations.write_json(sample_data, TEMP_FILE_PATH)

def teardown_function():
    """ Teardown function to remove the temporary JSON file after each test """
    if os.path.exists(TEMP_FILE_PATH):
        os.remove(TEMP_FILE_PATH)
def test_read_json():
    """ Test the read_json method with a valid JSON file """
    data = IOOperations.read_json(TEMP_FILE_PATH)
    assert data == {"key": "value"}

def test_read_json_file_not_found():
    """ Test the read_json method with a non-existent file """
    data = IOOperations.read_json('non_existent_file.json')
    assert data == {}

def test_read_json_invalid_json():
    """ Test the read_json method with an invalid JSON file """
    # Creating an invalid JSON file
    with open(TEMP_FILE_PATH, 'w') as file:
        file.write('Invalid JSON data')

    data = IOOperations.read_json(TEMP_FILE_PATH)
    assert data == {}

def test_write_json():
    """ Test the write_json method """
    data_to_write = {"new_key": "new_value"}
    IOOperations.write_json(data_to_write, TEMP_FILE_PATH)

    # Reading the data back to verify it was written correctly
    written_data = IOOperations.read_json(TEMP_FILE_PATH)
    assert written_data == data_to_write
