import UpdateProfile from "./UpdateProfile";
import ChangePassword from "./ChangePassword";

export function ProfilePage() {
  return (
    <div className="mt-2 p-6">
      <h1 className="text-2xl font-bold mb-6">Profile Settings</h1>
      <div className="space-y-8">
        {/* Update Profile Section */}
        <section>
          <UpdateProfile />
        </section>
        {/* Change Password Section */}
        <section>
          <ChangePassword />
        </section>
      </div>
    </div>
  );
}

export default ProfilePage;