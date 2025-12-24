// apiService.js

export const API_BASE_URL = "http://192.168.1.71:3000/api";

// Generic request wrapper
async function request(method, endpoint, body = null) {
  const options = {
    method,
    headers: { "Content-Type": "application/json" },
  };

  if (body) options.body = JSON.stringify(body);

  try {
    console.log(`🌐 API Request: ${method} ${API_BASE_URL}${endpoint}`, body ? { body } : '');
    
    const res = await fetch(`${API_BASE_URL}${endpoint}`, options);

    // Try to parse JSON, but handle non-JSON responses
    let json;
    const text = await res.text();
    
    try {
      json = text ? JSON.parse(text) : null;
    } catch (parseError) {
      console.warn(`⚠️ Could not parse JSON for ${endpoint}:`, text);
      json = null;
    }

    console.log(`📥 API Response for ${endpoint}:`, { 
      status: res.status, 
      ok: res.ok,
      data: json 
    });

    if (!res.ok) {
      return { 
        success: false, 
        error: json?.error || `Request failed with status ${res.status}`,
        status: res.status
      };
    }

    // Return whatever the server sent
    return json || { success: true };

  } catch (err) {
    console.error(`❌ API Error for ${endpoint}:`, err);
    return { 
      success: false, 
      error: err.message,
      networkError: true 
    };
  }
}

const apiService = {
  // LOGIN
  async login(email, password) {
    console.log("📱 Login attempt with:", email);
    
    const result = await request("POST", "/login", { email, password });
    
    console.log("Login API response:", result);
    
    if (result && result.success) {
      if (result.role === "admin") {
        return {
          success: true,
          role: "admin"
        };
      }
      
      if (result.role === "tech" && result.technician) {
        return {
          success: true,
          role: "tech",
          user: {
            id: result.technician.id,
            name: `${result.technician.firstName} ${result.technician.lastName}`,
            firstName: result.technician.firstName,
            lastName: result.technician.lastName,
            username: result.technician.username,
            email: result.technician.email
          }
        };
      }
    }
    
    return result || { success: false, error: "Invalid credentials" };
  },

  // CUSTOMERS
  getCustomers() {
    return request("GET", "/customers");
  },

  getCustomerById(id) {
    return request("GET", `/customers/${id}`);
  },

  createCustomer(data) {
    return request("POST", "/customers", data);
  },

  updateCustomer(id, data) {
    return request("PUT", `/customers/${id}`, data);
  },

  deleteCustomer(id) {
    return request("DELETE", `/customers/${id}`);
  },

  // TECHNICIANS
  getTechnicians() {
    return request("GET", "/technicians");
  },

  getTechnicianById(id) {
    return request("GET", `/technicians/${id}`);
  },

  createTechnician(data) {
    return request("POST", "/technicians", data);
  },

  updateTechnician(id, data) {
    return request("PUT", `/technicians/${id}`, data);
  },

  deleteTechnician(id) {
    return request("DELETE", `/technicians/${id}`);
  },
  
  // SCHEDULE
  getSchedule() {
    return request("GET", "/schedule");
  },

  updateSchedule(data) {
    return request("POST", "/schedule", data);
  },

  // Log individual station - UPDATED: Remove visitId
  logBaitStation(data) {
    // Extract only station data without visitId
    const stationData = {
      timestamp: data.timestamp,
      customerId: data.customerId,
      customerName: data.customerName || '',
      stationId: data.stationId,
      consumption: data.consumption || '',
      baitType: data.baitType || '',
      condition: data.condition || '',
      access: data.access || '',
      technicianId: data.technicianId,
      technicianName: data.technicianName || '',
      appointmentId: data.appointmentId || '',
      isVisitSummary: false
    };
    
    return request("POST", "/log", stationData);
  },

  // Log visit summary - UPDATED: Include all visit data
  logVisitSummary(data) {
    const visitData = {
      startTime: data.startTime,
      endTime: data.endTime,
      duration: data.duration,
      customerId: data.customerId,
      customerName: data.customerName,
      technicianId: data.technicianId,
      technicianName: data.technicianName,
      totalStations: data.stationData?.totalStations || 0,
      loggedStations: data.stationData?.loggedStations || 0,
      appointmentId: data.appointmentId || '',
      workType: data.workType || 'Manual Visit',
      visitId: data.visitId,
      isVisitSummary: true
    };
    
    return request("POST", "/log", visitData);
  },

  // NEW: Log complete visit with all data combined
  async logCompleteVisit(visitSummary, stations) {
    const completeData = {
      visitSummary,
      stations,
      action: 'complete-visit'
    };
    
    return request("POST", "/log-complete", completeData);
  }
};

export default apiService;