# Subscription Expiry Features

## 🎯 **Current Implementation (Already Working):**

### ✅ **Automatic Expiry Detection:**
- AuthContext में हर login पर check
- Toast message show करता है
- Database में status update होता है

### ✅ **Access Control:**
- Expired contractors को dashboard access नहीं मिलता
- Login block हो जाता है

## 🚀 **Additional Features We Can Add:**

### 1. **Grace Period (7 days before expiry):**
```typescript
// 7 days before expiry warning
if (daysRemaining <= 7 && daysRemaining > 0) {
  toast({
    title: "Subscription Expiring Soon",
    description: `Your subscription will expire in ${daysRemaining} days. Please recharge to avoid service interruption.`
  });
}
```

### 2. **Automatic Email Notifications:**
```typescript
// Send email 7 days before expiry
// Send email 1 day before expiry
// Send email on expiry day
```

### 3. **Soft Block (Limited Access):**
```typescript
// Allow limited access for 3 days after expiry
// Show "Recharge Now" banner
// Block new vehicle entries but allow existing ones
```

### 4. **Recharge Integration:**
```typescript
// Add payment gateway integration
// Allow contractors to extend their own subscriptions
// Show pricing plans in contractor dashboard
```

### 5. **Admin Notifications:**
```typescript
// Notify super admin about expiring subscriptions
// Show expiry reports in admin dashboard
// Send alerts for expired contractors
```

## 📱 **UI Features We Can Add:**

### 1. **Contractor Dashboard Warning:**
```jsx
{profile.subscription_status === 'expired' && (
  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
    <strong>Subscription Expired!</strong> Please recharge to continue using the service.
  </div>
)}
```

### 2. **Expiry Countdown:**
```jsx
{daysRemaining <= 7 && (
  <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
    <strong>Subscription Expiring Soon!</strong> {daysRemaining} days remaining.
  </div>
)}
```

### 3. **Recharge Button:**
```jsx
<Button onClick={() => setShowRechargeDialog(true)}>
  Recharge Now
</Button>
```

## 🔧 **Database Features We Can Add:**

### 1. **Expiry Tracking:**
```sql
-- Track when subscriptions expire
CREATE TABLE subscription_expiry_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id UUID REFERENCES profiles(id),
  expired_on TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  days_overdue INTEGER,
  action_taken VARCHAR(50)
);
```

### 2. **Grace Period Settings:**
```sql
-- Add grace period settings
ALTER TABLE subscription_plans 
ADD COLUMN grace_period_days INTEGER DEFAULT 0;
```

## 🎯 **Recommended Implementation Order:**

1. **Grace Period Warning** (7 days before)
2. **Contractor Dashboard Warnings**
3. **Admin Notifications**
4. **Payment Integration**
5. **Advanced Analytics**

## 💡 **Quick Wins (Easy to Implement):**

1. **Add expiry warnings to contractor dashboard**
2. **Show countdown timer**
3. **Add recharge button**
4. **Improve expiry messages**
5. **Add admin expiry reports**
