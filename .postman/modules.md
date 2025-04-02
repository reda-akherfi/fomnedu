### **Module API**  
**Base URL:** `/api/modules`  
**Headers:**  
- `Authorization: Bearer <JWT>` (Required)  

#### **Endpoints:**

1. **Create Module**  
   - **Method:** `POST`  
   - **Request Body:**  
     ```json
     {
       "name": "string",
       "description": "string",
       "taskIds": [1, 2, 3]
     }
     ```  
   - **Response (Success):**  
     ```json
     {
       "id": 1,
       "name": "string",
       "description": "string",
       "taskIds": [1, 2, 3]
     }
     ```  

2. **Get All Modules**  
   - **Method:** `GET`  
   - **Response (Success):**  
     ```json
     [
       {
         "id": 1,
         "name": "string",
         "description": "string",
         "taskIds": [1, 2, 3]
       }
     ]
     ```  

3. **Get Module by Name**  
   - **Method:** `GET`  
   - **Path:** `/{name}`  
   - **Response (Success):**  
     ```json
     {
       "id": 1,
       "name": "string",
       "description": "string",
       "taskIds": [1, 2, 3]
     }
     ```  

4. **Update Module**  
   - **Method:** `PUT`  
   - **Path:** `/{name}`  
   - **Request Body:**  
     ```json
     {
       "name": "string",
       "description": "string",
       "taskIds": [1, 2, 3]
     }
     ```  
   - **Response (Success):**  
     ```json
     {
       "id": 1,
       "name": "string",
       "description": "string",
       "taskIds": [1, 2, 3]
     }
     ```  

5. **Delete Module**  
   - **Method:** `DELETE`  
   - **Path:** `/{name}`  
   - **Response:** `204 No Content`  

