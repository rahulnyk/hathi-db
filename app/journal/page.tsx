import { withAuth } from "@/components/auth/with-auth";
import { User } from "@supabase/supabase-js";
import { JournalComponent } from "@/components/journal";

function Journal({ user }: { user: User }) {
    return (
        <div className="flex flex-row w-full relative">
            <JournalComponent user={user} />
        </div>
    );
}

export default withAuth(Journal);
