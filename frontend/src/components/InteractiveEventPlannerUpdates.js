// This file contains the updated functions for InteractiveEventPlanner.js
// These should replace the existing functions in the main file

  const savePlan = async () => {
    try {
      // Save planner state to backend
      await axios.post(`${API}/events/${eventId}/planner/state`, {
        current_step: currentStep,
        completed_steps: Array.from({ length: currentStep }, (_, i) => i), // Mark previous steps as completed
        step_data: {
          last_saved: new Date().toISOString()
        }
      }, getAuthHeaders());
      
      // Keep localStorage as backup
      const planData = {
        currentStep,
        selectedServices,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem(`event-plan-${eventId}`, JSON.stringify(planData));
    } catch (err) {
      console.error('Error saving plan to backend:', err);
      // Fallback to localStorage only
      try {
        const planData = {
          currentStep,
          selectedServices,
          timestamp: new Date().toISOString()
        };
        localStorage.setItem(`event-plan-${eventId}`, JSON.stringify(planData));
      } catch (localErr) {
        console.error('Error saving plan locally:', localErr);
      }
    }
  };

  const removeFromCart = async (itemId) => {
    try {
      await axios.delete(`${API}/events/${eventId}/cart/remove/${itemId}`, getAuthHeaders());
      
      // Refresh cart and update selected services
      await loadCartFromBackend();
      
      // Update selected services by removing the item
      const item = cart.find(c => c.id === itemId);
      if (item) {
        setSelectedServices(prev => {
          const updated = { ...prev };
          delete updated[item.service_type];
          return updated;
        });
      }
    } catch (err) {
      console.error('Error removing from cart:', err);
    }
  };

  const addToCart = async (stepId, vendor) => {
    try {
      const cartRequest = {
        vendor_id: vendor.id,
        service_type: stepId,
        service_name: vendor.name,
        price: vendor.recommended_price || vendor.price_range?.min || vendor.base_price || 1000,
        quantity: 1,
        notes: `Selected from ${plannerSteps.find(s => s.id === stepId)?.title} step`
      };

      // Use the new Interactive Event Planner cart API
      const response = await axios.post(`${API}/events/${eventId}/cart/add`, cartRequest, getAuthHeaders());

      if (response.data) {
        // Refresh cart from backend
        await loadCartFromBackend();
        
        // Update selected services
        setSelectedServices(prev => ({
          ...prev,
          [stepId]: vendor.id
        }));

        // Show budget status
        if (response.data.budget_status === 'over_budget') {
          alert('Warning: This selection puts you over budget!');
        }
      }
    } catch (err) {
      console.error('Error adding to cart:', err);
      alert('Failed to add item to cart. Please try again.');
    }
  };

  const clearCart = async () => {
    try {
      await axios.post(`${API}/events/${eventId}/cart/clear`, {}, getAuthHeaders());
      
      setCart([]);
      setSelectedServices({});
      setBudgetData({
        set: currentEvent?.budget || 0,
        selected: 0,
        remaining: currentEvent?.budget || 0
      });
    } catch (err) {
      console.error('Error clearing cart:', err);
    }
  };

  const finalizePlan = async () => {
    try {
      setSaving(true);
      
      // Use the new Interactive Event Planner finalize endpoint
      const response = await axios.post(`${API}/events/${eventId}/planner/finalize`, {}, getAuthHeaders());

      if (response.data) {
        const bookings = response.data.bookings_created || [];
        
        // Notify parent component
        if (onPlanSaved) {
          onPlanSaved(bookings);
        }
        
        // Clear local state
        setCart([]);
        setSelectedServices({});
        
        alert(`Event plan finalized successfully! Created ${bookings.length} vendor bookings with total cost of ${formatCurrency(response.data.total_cost || 0)}.`);
        
        onClose();
      }
    } catch (err) {
      console.error('Error finalizing event plan:', err);
      alert('Failed to finalize event plan. Please try again.');
    } finally {
      setSaving(false);
    }
  };