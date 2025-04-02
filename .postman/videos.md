Here's the condensed API description for the Video endpoints:

---

### **Video API**  
**Base URL:** `/api/videos`  
**Headers:**  
- `Authorization: Bearer <JWT>` (Required)  

#### **Endpoints:**

1. **Create Video**  
   - **Method:** `POST`  
   - **Request Body:**  
     ```json
     {
       "title": "string (required)",
       "url": "string (required)",
       "taskIds": [1, 2, 3]
     }
     ```  
   - **Response (Success - 201 Created):**  
     ```json
     {
       "id": 1,
       "title": "string",
       "url": "string",
       "userId": "string",
       "taskIds": [1, 2, 3],
       "createdAt": "yyyy-MM-ddTHH:mm:ss",
       "updatedAt": "yyyy-MM-ddTHH:mm:ss"
     }
     ```  

2. **Get Video by ID**  
   - **Method:** `GET`  
   - **Path:** `/{id}`  
   - **Response (Success):**  
     ```json
     {
       "id": 1,
       "title": "string",
       "url": "string",
       "userId": "string",
       "taskIds": [1, 2, 3],
       "createdAt": "yyyy-MM-ddTHH:mm:ss",
       "updatedAt": "yyyy-MM-ddTHH:mm:ss"
     }
     ```  

3. **Get All User Videos**  
   - **Method:** `GET`  
   - **Response (Success):**  
     ```json
     [
       {
         "id": 1,
         "title": "string",
         "url": "string",
         "userId": "string",
         "taskIds": [1, 2, 3],
         "createdAt": "yyyy-MM-ddTHH:mm:ss",
         "updatedAt": "yyyy-MM-ddTHH:mm:ss"
       }
     ]
     ```  

4. **Get Videos for Task**  
   - **Method:** `GET`  
   - **Path:** `/task/{taskId}`  
   - **Response:** Same as *Get All User Videos*.  

5. **Update Video**  
   - **Method:** `PUT`  
   - **Path:** `/{id}`  
   - **Request Body:** Same as *Create Video*.  
   - **Response (Success):** Same as *Get Video by ID*.  

6. **Delete Video**  
   - **Method:** `DELETE`  
   - **Path:** `/{id}`  
   - **Response:** `204 No Content`  

--- 

### **Notes:**  
- All endpoints require JWT authentication.  
- The `X-User-Id` is automatically added by the gateway (not required in client requests).  
- **Validation:**  
  - `title` and `url` are required fields.  
- **Task Associations:**  
  - Videos can be linked to multiple tasks via `taskIds`.  
- **Timestamps:** Follow ISO-8601 format (`yyyy-MM-ddTHH:mm:ss`).  

--- 

### **Example Requests:**  
1. **Create a Video:**  
   ```bash
   curl -X POST -H "Authorization: Bearer <JWT>" -H "Content-Type: application/json" \
   -d '{"title": "Tutorial", "url": "https://example.com/video1", "taskIds": [1, 2]}' \
   http://localhost:8080/api/videos
   ```  
2. **Get Videos for Task:**  
   ```bash
   curl -X GET -H "Authorization: Bearer <JWT>" http://localhost:8080/api/videos/task/1
   ```  

--- 

This covers all CRUD operations and task associations for videos. Let me know if you need any modifications!