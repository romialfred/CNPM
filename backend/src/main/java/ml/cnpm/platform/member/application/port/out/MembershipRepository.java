package ml.cnpm.platform.member.application.port.out;

import ml.cnpm.platform.member.application.MembershipQuery;
import ml.cnpm.platform.member.domain.Membership;
import ml.cnpm.platform.shared.api.PageResult;

/** Port sortant de lecture des adhésions. */
public interface MembershipRepository {

    PageResult<Membership> search(MembershipQuery query);
}
