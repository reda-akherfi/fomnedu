### **Document API**  
**Base URL:** `/api/documents`  
**Headers:**  
- `Authorization: Bearer <JWT>` (Required)  

#### **Endpoints:**

1. **Upload Document**  
   - **Method:** `POST`  
   - **Content-Type:** `multipart/form-data`  
   - **Request Parameters:**  
     - `file`: The document file to upload (required)  
     - `taskIds`: Optional list of task IDs to associate with the document (e.g., `1,2,3`)  
   - **Response (Success):**  
     ```json
     {
       "id": "string",
       "name": "string",
       "contentType": "string",
       "size": 12345,
       "uploadDate": "yyyy-MM-ddTHH:mm:ss",
       "downloadUrl": "string",
       "userId": "string",
       "taskIds": [1, 2, 3],
       "description": "string"
     }
     ```  

2. **Download Document**  
   - **Method:** `GET`  
   - **Path:** `/{id}`  
   - **Response:**  
     - **Success:** Returns the document file as a downloadable attachment with headers:  
       - `Content-Type`: Matches the document's MIME type.  
       - `Content-Disposition`: `attachment; filename="original-filename.ext"`.  
     - **Failure (404):** If document not found or user mismatch.  

3. **Get All User Documents**  
   - **Method:** `GET`  
   - **Response (Success):**  
     ```json
     [
       {
         "id": "string",
         "name": "string",
         "contentType": "string",
         "size": 12345,
         "uploadDate": "yyyy-MM-ddTHH:mm:ss",
         "downloadUrl": "string",
         "userId": "string",
         "taskIds": [1, 2, 3],
         "description": "string"
       }
     ]
     ```  

4. **Get Documents for Task**  
   - **Method:** `GET`  
   - **Path:** `/task/{taskId}`  
   - **Response:** Same as *Get All User Documents*.  

5. **Delete Document**  
   - **Method:** `DELETE`  
   - **Path:** `/{id}`  
   - **Response:** `204 No Content`  

--- 

### **Notes:**  
- All endpoints require JWT authentication.  
- The `X-User-Id` is automatically added by the gateway (not required in client requests).  
- **File Uploads:**  
  - Use `multipart/form-data` for `POST /api/documents`.  
  - Supported file types depend on server configuration.  
- **Timestamps:** Follow ISO-8601 format (`yyyy-MM-ddTHH:mm:ss`).  
- **Task Associations:**  
  - Documents can be linked to multiple tasks via `taskIds`.  
  - Use commas to separate IDs in query params (e.g., `taskIds=1,2,3`).  

--- 

### **Example Requests:**  
1. **Upload a Document:**  
   ```bash
   curl -X POST -H "Authorization: Bearer <JWT>" -F "file=@report.pdf" -F "taskIds=1,2" http://localhost:8080/api/documents
   ```  
2. **Download a Document:**  
   ```bash
   curl -X GET -H "Authorization: Bearer <JWT>" -OJ http://localhost:8080/api/documents/doc123
   ```  

