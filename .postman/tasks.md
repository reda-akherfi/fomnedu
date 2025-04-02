### **Task API**  
**Base URL:** `/api/tasks`  
**Headers:**  
- `Authorization: Bearer <JWT>` (Required)  

#### **Endpoints:**

1. **Create Task**  
   - **Method:** `POST`  
   - **Request Body:**  
     ```json
     {
       "title": "string (max 100 chars)",
       "description": "string (max 1000 chars)",
       "status": "PENDING | IN_PROGRESS | COMPLETED",
       "priority": "LOW | MEDIUM | HIGH",
       "dueDate": "yyyy-MM-ddTHH:mm:ss (future/present)"
     }
     ```  
   - **Response (Success - 201 Created):**  
     ```json
     {
       "id": 1,
       "title": "string",
       "description": "string",
       "status": "string",
       "priority": "string",
       "dueDate": "yyyy-MM-ddTHH:mm:ss",
       "createdAt": "yyyy-MM-ddTHH:mm:ss",
       "updatedAt": "yyyy-MM-ddTHH:mm:ss"
     }
     ```  

2. **Get Task by ID**  
   - **Method:** `GET`  
   - **Path:** `/{id}`  
   - **Response (Success):**  
     ```json
     {
       "id": 1,
       "title": "string",
       "description": "string",
       "status": "string",
       "priority": "string",
       "dueDate": "yyyy-MM-ddTHH:mm:ss",
       "createdAt": "yyyy-MM-ddTHH:mm:ss",
       "updatedAt": "yyyy-MM-ddTHH:mm:ss"
     }
     ```  

3. **Get All Tasks**  
   - **Method:** `GET`  
   - **Response (Success):**  
     ```json
     [
       {
         "id": 1,
         "title": "string",
         "description": "string",
         "status": "string",
         "priority": "string",
         "dueDate": "yyyy-MM-ddTHH:mm:ss",
         "createdAt": "yyyy-MM-ddTHH:mm:ss",
         "updatedAt": "yyyy-MM-ddTHH:mm:ss"
       }
     ]
     ```  

4. **Get Tasks by Status**  
   - **Method:** `GET`  
   - **Path:** `/status/{status}`  
   - **Valid Status Values:** `PENDING | IN_PROGRESS | COMPLETED`  
   - **Response:** Same as *Get All Tasks*.  

5. **Get Tasks by Priority**  
   - **Method:** `GET`  
   - **Path:** `/priority/{priority}`  
   - **Valid Priority Values:** `LOW | MEDIUM | HIGH`  
   - **Response:** Same as *Get All Tasks*.  

6. **Get Overdue Tasks**  
   - **Method:** `GET`  
   - **Path:** `/overdue`  
   - **Response:** Same as *Get All Tasks*.  

7. **Update Task**  
   - **Method:** `PUT`  
   - **Path:** `/{id}`  
   - **Request Body:** Same as *Create Task*.  
   - **Response (Success):** Same as *Get Task by ID*.  

8. **Delete Task**  
   - **Method:** `DELETE`  
   - **Path:** `/{id}`  
   - **Response:** `204 No Content`  

9. **Get Tasks by Batch IDs**  
   - **Method:** `GET`  
   - **Path:** `/batch`  
   - **Query Param:** `ids=1,2,3`  
   - **Response:** Same as *Get All Tasks*.  

--- 

### **Notes:**  
- All endpoints require JWT authentication.  
- The `X-User-Id` is automatically added by the gateway (not required in client requests).  
- `status` and `priority` are enum values (case-sensitive).  
- `dueDate` must be current or future (validated).  
- Timestamps follow ISO-8601 format (`yyyy-MM-ddTHH:mm:ss`).