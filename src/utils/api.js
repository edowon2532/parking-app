let API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) {
    API_URL = '';
}

// Remove trailing slash if present to avoid double slashes (e.g., //api)
if (API_URL.endsWith('/')) {
    API_URL = API_URL.slice(0, -1);
}

export const fetchVehicles = async () => {
    try {
        const response = await fetch(`${API_URL}/api/vehicles`);
        if (!response.ok) throw new Error('Failed to fetch vehicles');
        return await response.json();
    } catch (error) {
        console.error("Error fetching vehicles:", error);
        return [];
    }
};

export const createVehicle = async (vehicle) => {
    try {
        const response = await fetch(`${API_URL}/api/vehicles`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(vehicle)
        });
        if (!response.ok) throw new Error('Failed to create vehicle');
        return await response.json();
    } catch (error) {
        console.error("Error creating vehicle:", error);
        throw error;
    }
};

export const updateVehicle = async (vehicle) => {
    try {
        const response = await fetch(`${API_URL}/api/vehicles/${vehicle.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(vehicle)
        });
        if (!response.ok) throw new Error('Failed to update vehicle');
        return await response.json();
    } catch (error) {
        console.error("Error updating vehicle:", error);
        throw error;
    }
};

export const deleteVehicle = async (vehicleId) => {
    try {
        const response = await fetch(`${API_URL}/api/vehicles/${vehicleId}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Failed to delete vehicle');
        return await response.json();
    } catch (error) {
        console.error("Error deleting vehicle:", error);
        throw error;
    }
};

export const addViolation = async (vehicleId, violation) => {
    try {
        const response = await fetch(`${API_URL}/api/vehicles/${vehicleId}/violations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(violation)
        });
        if (!response.ok) throw new Error('Failed to add violation');
        return await response.json();
    } catch (error) {
        console.error("Error adding violation:", error);
        throw error;
    }
};

export const fetchHistory = async () => {
    try {
        const response = await fetch(`${API_URL}/api/history`);
        if (!response.ok) throw new Error('Failed to fetch history');
        return await response.json();
    } catch (error) {
        console.error("Error fetching history:", error);
        return [];
    }
};

export const createHistoryItem = async (item) => {
    try {
        const response = await fetch(`${API_URL}/api/history`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item)
        });
        if (!response.ok) throw new Error('Failed to create history item');
        return await response.json();
    } catch (error) {
        console.error("Error creating history item:", error);
        throw error;
    }
};

export const uploadImage = async (file) => {
    try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${API_URL}/api/upload`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) throw new Error('Failed to upload image');
        const data = await response.json();

        // If URLs are relative, prepend API_URL
        if (data.url && !data.url.startsWith('http')) {
            data.url = `${API_URL}${data.url}`;
        }
        if (data.thumbnail && !data.thumbnail.startsWith('http')) {
            data.thumbnail = `${API_URL}${data.thumbnail}`;
        }

        return data;
    } catch (error) {
        console.error("Error uploading image:", error);
        throw error;
    }
};
